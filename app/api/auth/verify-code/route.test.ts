import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { auth: { verifyOtp: vi.fn() } },
}));

vi.mock("@/lib/supabase/users", () => ({
  getUserByEmail: vi.fn(),
  getUserByPhone: vi.fn(),
  updateUser: vi.fn(),
  registerUserByEmail: vi.fn(),
}));

import { supabaseAdmin } from "@/lib/supabase/server";
import {
  getUserByEmail,
  getUserByPhone,
  updateUser,
  registerUserByEmail,
} from "@/lib/supabase/users";
import { POST } from "@/app/api/auth/verify-code/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/verify-code", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function mockVerifyOtpSuccess() {
  (supabaseAdmin.auth.verifyOtp as any).mockResolvedValue({ data: {}, error: null });
}

describe("POST /api/auth/verify-code", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email or code is missing", async () => {
    const res = await POST(makeRequest({ email: "ana@example.com" }));
    expect(res.status).toBe(400);
    expect(supabaseAdmin.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("calls verifyOtp with normalized email", async () => {
    mockVerifyOtpSuccess();
    (getUserByEmail as any).mockResolvedValue({ id: "1", email: "ana@example.com" });

    await POST(makeRequest({ email: "  Ana@Example.com ", code: "123456", action: "login" }));

    expect(supabaseAdmin.auth.verifyOtp).toHaveBeenCalledWith({
      email: "ana@example.com",
      token: "123456",
      type: "email",
    });
  });

  it("returns 400 when the code is invalid or expired", async () => {
    (supabaseAdmin.auth.verifyOtp as any).mockResolvedValue({
      data: {},
      error: { status: 400, message: "Token has expired or is invalid" },
    });

    const res = await POST(makeRequest({ email: "ana@example.com", code: "000000", action: "login" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Código inválido ou expirado");
  });

  describe("action: login", () => {
    it("returns 200 with the user when found", async () => {
      mockVerifyOtpSuccess();
      const user = { id: "1", email: "ana@example.com" };
      (getUserByEmail as any).mockResolvedValue(user);

      const res = await POST(makeRequest({ email: "ana@example.com", code: "123456", action: "login" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true, verified: true, user });
    });

    it("returns 404 when the user is not found", async () => {
      mockVerifyOtpSuccess();
      (getUserByEmail as any).mockResolvedValue(null);

      const res = await POST(makeRequest({ email: "ana@example.com", code: "123456", action: "login" }));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe("Usuário não encontrado");
    });
  });

  describe("action: register", () => {
    it("returns 400 when name or phone is missing", async () => {
      mockVerifyOtpSuccess();

      const res = await POST(
        makeRequest({ email: "ana@example.com", code: "123456", action: "register", name: "Ana" })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Nome e telefone são obrigatórios");
      expect(registerUserByEmail).not.toHaveBeenCalled();
    });

    it("returns 200 with the created/found user on success", async () => {
      mockVerifyOtpSuccess();
      const user = { id: "1", email: "ana@example.com", name: "Ana", phone: "5511999999999" };
      (registerUserByEmail as any).mockResolvedValue({ status: "created", user });

      const res = await POST(
        makeRequest({
          email: "ana@example.com",
          code: "123456",
          action: "register",
          name: "Ana",
          phone: "(11) 99999-9999",
        })
      );
      const body = await res.json();

      expect(registerUserByEmail).toHaveBeenCalledWith({
        name: "Ana",
        phone: "11999999999",
        email: "ana@example.com",
      });
      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true, verified: true, user });
    });

    it("returns 409 on phone collision", async () => {
      mockVerifyOtpSuccess();
      (registerUserByEmail as any).mockResolvedValue({ status: "phone_conflict" });

      const res = await POST(
        makeRequest({
          email: "ana@example.com",
          code: "123456",
          action: "register",
          name: "Ana",
          phone: "11999999999",
        })
      );
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.error).toMatch(/já está cadastrado/);
    });
  });

  describe("action: link", () => {
    it("returns 400 when phone is missing", async () => {
      mockVerifyOtpSuccess();

      const res = await POST(makeRequest({ email: "ana@example.com", code: "123456", action: "link" }));

      expect(res.status).toBe(400);
      expect(getUserByPhone).not.toHaveBeenCalled();
    });

    it("returns 404 when no account matches the phone", async () => {
      mockVerifyOtpSuccess();
      (getUserByPhone as any).mockResolvedValue(null);

      const res = await POST(
        makeRequest({ email: "ana@example.com", code: "123456", action: "link", phone: "11999999999" })
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe("Não encontramos nenhuma conta com esse telefone.");
      expect(updateUser).not.toHaveBeenCalled();
    });

    it("updates the found user's email and returns 200", async () => {
      mockVerifyOtpSuccess();
      const foundUser = { id: "9", phone: "11999999999", email: null };
      const updatedUser = { id: "9", phone: "11999999999", email: "ana@example.com" };
      (getUserByPhone as any).mockResolvedValue(foundUser);
      (updateUser as any).mockResolvedValue(updatedUser);

      const res = await POST(
        makeRequest({
          email: "ana@example.com",
          code: "123456",
          action: "link",
          phone: "(11) 99999-9999",
        })
      );
      const body = await res.json();

      expect(getUserByPhone).toHaveBeenCalledWith("11999999999");
      expect(updateUser).toHaveBeenCalledWith("9", { email: "ana@example.com" });
      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true, verified: true, user: updatedUser });
    });
  });
});
