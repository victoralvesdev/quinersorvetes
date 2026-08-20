import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

import { supabaseAdmin } from "@/lib/supabase/server";
import { getUserByEmail, registerUserByEmail } from "@/lib/supabase/users";

function mockSelectEqMaybeSingle(result: { data: any; error: any }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  return { select };
}

describe("getUserByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the user when found", async () => {
    const fakeUser = {
      id: "1",
      name: "Ana",
      phone: "5511999999999",
      email: "ana@example.com",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    (supabaseAdmin.from as any).mockReturnValue(
      mockSelectEqMaybeSingle({ data: fakeUser, error: null })
    );

    const result = await getUserByEmail("ana@example.com");

    expect(result).toEqual(fakeUser);
    expect(supabaseAdmin.from).toHaveBeenCalledWith("users");
  });

  it("returns null when no user matches", async () => {
    (supabaseAdmin.from as any).mockReturnValue(
      mockSelectEqMaybeSingle({ data: null, error: null })
    );

    const result = await getUserByEmail("ninguem@example.com");

    expect(result).toBeNull();
  });
});

describe("registerUserByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const formData = {
    name: "Ana",
    phone: "5511999999999",
    email: "ana@example.com",
  };

  it("returns the existing user when the email already exists", async () => {
    const existingUser = {
      id: "1",
      name: "Ana",
      phone: "5511999999999",
      email: "ana@example.com",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    (supabaseAdmin.from as any).mockReturnValue(
      mockSelectEqMaybeSingle({ data: existingUser, error: null })
    );

    const result = await registerUserByEmail(formData);

    expect(result).toEqual({ status: "existing", user: existingUser });
    // Só deve consultar por email; não deve chegar a checar telefone/criar.
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1);
  });

  it("returns phone_conflict when the phone belongs to a different account", async () => {
    const conflictingUser = {
      id: "2",
      name: "Outra Pessoa",
      phone: "5511999999999",
      email: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };

    let call = 0;
    (supabaseAdmin.from as any).mockImplementation(() => {
      call += 1;
      // 1ª chamada: getUserByEmail -> não encontrado
      // 2ª chamada: getUserByPhone -> encontrado (conflito)
      return call === 1
        ? mockSelectEqMaybeSingle({ data: null, error: null })
        : mockSelectEqMaybeSingle({ data: conflictingUser, error: null });
    });

    const result = await registerUserByEmail(formData);

    expect(result).toEqual({ status: "phone_conflict" });
  });

  it("creates a new user when neither email nor phone exist", async () => {
    const createdUser = {
      id: "3",
      name: "Ana",
      phone: "5511999999999",
      email: "ana@example.com",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };

    let call = 0;
    (supabaseAdmin.from as any).mockImplementation((table: string) => {
      call += 1;
      if (call === 1 || call === 2) {
        // getUserByEmail, getUserByPhone -> ambos não encontrados
        return mockSelectEqMaybeSingle({ data: null, error: null });
      }
      // createUser
      const single = vi.fn().mockResolvedValue({ data: createdUser, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      if (table === "coupons") {
        const gte = vi.fn().mockResolvedValue({ data: [], error: null });
        const lte = vi.fn().mockReturnValue({ gte });
        const eq = vi.fn().mockReturnValue({ lte });
        const select2 = vi.fn().mockReturnValue({ eq });
        return { select: select2, insert };
      }
      return { insert };
    });

    const result = await registerUserByEmail(formData);

    expect(result).toEqual({ status: "created", user: createdUser });
  });
});
