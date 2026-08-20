import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/users", () => ({
  getUserByPhone: vi.fn(),
  getUserByEmail: vi.fn(),
  registerUserByEmail: vi.fn(),
  updateUser: vi.fn(),
}));

import {
  getUserByPhone,
  getUserByEmail,
  registerUserByEmail,
  updateUser,
} from "@/lib/supabase/users";
import { GET, POST, PATCH } from "@/app/api/users/route";

describe("GET /api/users", () => {
  beforeEach(() => vi.clearAllMocks());

  it("looks up by email when ?email= is present", async () => {
    (getUserByEmail as any).mockResolvedValue({ id: "1", email: "a@b.com" });

    const req = new NextRequest("http://localhost/api/users?email=a@b.com");
    const res = await GET(req);
    const body = await res.json();

    expect(getUserByEmail).toHaveBeenCalledWith("a@b.com");
    expect(getUserByPhone).not.toHaveBeenCalled();
    expect(body).toEqual({ id: "1", email: "a@b.com" });
  });

  it("normalizes the email query param (trim + lowercase) before lookup", async () => {
    (getUserByEmail as any).mockResolvedValue({ id: "1", email: "a@b.com" });

    const req = new NextRequest(
      `http://localhost/api/users?email=${encodeURIComponent("  A@B.com ")}`
    );
    await GET(req);

    expect(getUserByEmail).toHaveBeenCalledWith("a@b.com");
  });

  it("looks up by phone when ?phone= is present", async () => {
    (getUserByPhone as any).mockResolvedValue({ id: "2", phone: "5511999999999" });

    const req = new NextRequest("http://localhost/api/users?phone=5511999999999");
    await GET(req);

    expect(getUserByPhone).toHaveBeenCalledWith("5511999999999");
  });

  it("returns 400 when neither phone nor email is present", async () => {
    const req = new NextRequest("http://localhost/api/users");
    const res = await GET(req);

    expect(res.status).toBe(400);
  });
});

describe("POST /api/users", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email is missing", async () => {
    const req = new NextRequest("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", phone: "5511999999999" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(registerUserByEmail).not.toHaveBeenCalled();
  });

  it("creates the user when email is present", async () => {
    const payload = { name: "Ana", phone: "5511999999999", email: "ana@example.com" };
    (registerUserByEmail as any).mockResolvedValue({
      status: "created",
      user: { id: "1", ...payload },
    });

    const req = new NextRequest("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(registerUserByEmail).toHaveBeenCalledWith(payload);
    expect(body.email).toBe("ana@example.com");
  });

  it("normalizes the email before calling registerUserByEmail", async () => {
    (registerUserByEmail as any).mockResolvedValue({
      status: "created",
      user: { id: "1", name: "Ana", phone: "5511999999999", email: "ana@example.com" },
    });

    const req = new NextRequest("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", phone: "5511999999999", email: "  Ana@Example.com " }),
    });

    await POST(req);

    expect(registerUserByEmail).toHaveBeenCalledWith({
      name: "Ana",
      phone: "5511999999999",
      email: "ana@example.com",
    });
  });

  it("returns 409 when the phone belongs to a different account", async () => {
    (registerUserByEmail as any).mockResolvedValue({ status: "phone_conflict" });

    const req = new NextRequest("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ name: "Ana", phone: "5511999999999", email: "ana@example.com" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/já está cadastrado/);
  });
});

describe("PATCH /api/users", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when cpf is missing", async () => {
    const req = new NextRequest("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "1" }),
    });

    const res = await PATCH(req);

    expect(res.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("updates cpf for an existing user", async () => {
    (updateUser as any).mockResolvedValue({ id: "1", cpf: "12345678900" });

    const req = new NextRequest("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "1", cpf: "12345678900" }),
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(updateUser).toHaveBeenCalledWith("1", { cpf: "12345678900" });
    expect(body.cpf).toBe("12345678900");
  });

  it("no longer accepts email (ignored, still requires cpf)", async () => {
    const req = new NextRequest("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "1", email: "novo@example.com" }),
    });

    const res = await PATCH(req);

    expect(res.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });
});
