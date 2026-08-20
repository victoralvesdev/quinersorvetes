import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { auth: { signInWithOtp: vi.fn() } },
}));

import { supabaseAdmin } from "@/lib/supabase/server";
import { POST } from "@/app/api/auth/send-code/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/send-code", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/send-code", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(supabaseAdmin.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("returns 400 when email is malformed", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(supabaseAdmin.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("calls signInWithOtp with a normalized email and returns 200", async () => {
    (supabaseAdmin.auth.signInWithOtp as any).mockResolvedValue({ data: {}, error: null });

    const res = await POST(makeRequest({ email: "  Ana@Example.com  " }));
    const body = await res.json();

    expect(supabaseAdmin.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "ana@example.com",
      options: { shouldCreateUser: true },
    });
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("maps a Supabase rate-limit error to 429", async () => {
    (supabaseAdmin.auth.signInWithOtp as any).mockResolvedValue({
      data: {},
      error: { status: 429, message: "over_email_send_rate_limit" },
    });

    // distinct email so this test's own in-memory rate-limit counter
    // starts fresh, independent of the other tests in this file
    const res = await POST(makeRequest({ email: "limite@example.com" }));

    expect(res.status).toBe(429);
  });

  it("returns 500 on unexpected Supabase errors", async () => {
    (supabaseAdmin.auth.signInWithOtp as any).mockResolvedValue({
      data: {},
      error: { status: 500, message: "boom" },
    });

    const res = await POST(makeRequest({ email: "erro@example.com" }));

    expect(res.status).toBe(500);
  });
});
