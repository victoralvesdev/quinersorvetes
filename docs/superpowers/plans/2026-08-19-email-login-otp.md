# Login/cadastro por email (OTP via Supabase Auth) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the WhatsApp-based verification code with an email OTP (via Supabase Auth's native `signInWithOtp`/`verifyOtp`) for login/registration, while keeping phone as a required contact field for orders/WhatsApp notifications.

**Architecture:** `users` gains a nullable, unique `email` column. `/api/auth/send-code` and `/api/auth/verify-code` are rewritten to call Supabase Auth's email OTP instead of writing to the custom `verification_codes` table / sending WhatsApp. `/api/users` gains email-based lookup and an email-patch path used to link legacy phone-only accounts to a new email without creating duplicates. `AuthContext` and `LoginModal` switch their identity key from phone to email, with an added "recover by phone" sub-flow for existing users.

**Tech Stack:** Next.js 14 App Router, TypeScript, `@supabase/supabase-js` (Auth `signInWithOtp`/`verifyOtp`), react-hook-form + Zod, Vitest (new, for the backend/lib layer — the repo has no test runner yet).

**Spec:** `docs/superpowers/specs/2026-08-19-email-login-otp-design.md`

## Global Constraints

- Phone stays required for registration and keeps powering WhatsApp order notifications, delivery reminders, and the product-registration bot — none of that changes.
- No custom email-sending code and no Resend — verification email is sent exclusively through Supabase Auth's built-in email OTP (`signInWithOtp` / `verifyOtp`).
- The app keeps its own session model (`users` table + `localStorage`) — do not adopt Supabase Auth's JWT/session for the app; the Supabase session returned by `verifyOtp` is discarded after confirming the email.
- `verification_codes` table stays as-is (unused by the new flow, not migrated, not deleted).
- All user-facing strings are Portuguese (pt-BR), matching the rest of the app.

---

### Task 1: Test infrastructure (Vitest)

The repo has no test runner. This task adds a minimal Vitest setup used by Tasks 4–7 to TDD the backend/lib changes.

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `vitest` devDependency + `test` script)
- Test: `lib/sanity.test.ts` (throwaway, deleted at the end of this task)

**Interfaces:**
- Produces: `npm test` runs `vitest run`; `@/` path alias resolves in tests the same way it does in the app.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Add `test` script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write a throwaway sanity test**

Create `lib/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("resolves the @ alias and runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it to confirm the setup works**

Run: `npm test`
Expected: 1 passed test file, 1 passed test.

- [ ] **Step 6: Delete the sanity test and commit**

```bash
rm lib/sanity.test.ts
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest for backend/lib unit tests"
```

---

### Task 2: Database migration — add `email` to `users`

**Files:**
- Create: `supabase/migrations/20260819_add_email_to_users.sql`

**Interfaces:**
- Produces: `users.email` column (nullable, unique) that Tasks 4–9 read/write.

- [ ] **Step 1: Find the Supabase project**

Use the Supabase MCP tool `list_projects` to find the project backing this repo (its name/ref corresponds to the `NEXT_PUBLIC_SUPABASE_URL` used by the app — cross-check with `get_project_url` on candidates if more than one project exists in the org).

- [ ] **Step 2: Confirm current `users` schema**

Use the Supabase MCP tool `list_tables` (schema `public`) and confirm `users` has `id, name, phone, cpf, created_at, updated_at` and no `email` column yet.

- [ ] **Step 3: Write the migration file**

Create `supabase/migrations/20260819_add_email_to_users.sql`:

```sql
-- Adiciona email como identificador de login (substitui telefone/WhatsApp
-- como canal de verificação). Nullable porque contas existentes ainda não
-- têm email; UNIQUE impede duas contas com o mesmo email (Postgres permite
-- múltiplos NULLs em uma coluna UNIQUE, então não afeta contas legadas).
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

- [ ] **Step 4: Apply it to the project**

Use the Supabase MCP tool `apply_migration` with `name: "add_email_to_users"` and the SQL body above, targeting the project found in Step 1.

- [ ] **Step 5: Verify**

Use the Supabase MCP tool `list_tables` again and confirm `users.email` now exists with type `character varying` and the unique index is present.

- [ ] **Step 6: Commit the migration file**

```bash
git add supabase/migrations/20260819_add_email_to_users.sql
git commit -m "feat(db): add unique email column to users"
```

---

### Task 3: Update `User` / `UserFormData` types

**Files:**
- Modify: `types/user.ts`

**Interfaces:**
- Produces: `User.email: string | null`, `UserFormData.email: string` — consumed by Tasks 4, 5, 8, 9.

- [ ] **Step 1: Update the file**

Replace the full contents of `types/user.ts`:

```ts
export interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  cpf?: string;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  name: string;
  phone: string;
  email: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: new errors appear in files that construct `UserFormData` without `email` (that's expected — Tasks 5, 8, 9 fix those call sites). Confirm the errors are limited to `app/api/users/route.ts` usage sites and `components/auth/LoginModal.tsx` / `contexts/AuthContext.tsx` — not unrelated files.

- [ ] **Step 3: Commit**

```bash
git add types/user.ts
git commit -m "feat: add email to User and UserFormData types"
```

---

### Task 4: `getUserByEmail` in `lib/supabase/users.ts`

**Files:**
- Modify: `lib/supabase/users.ts`
- Test: `lib/supabase/users.test.ts`

**Interfaces:**
- Consumes: `supabaseAdmin` from `@/lib/supabase/server` (`.from('users').select('*').eq('email', email).maybeSingle()`).
- Produces: `getUserByEmail(email: string): Promise<User | null>` — consumed by Task 5 (`app/api/users/route.ts` GET).

- [ ] **Step 1: Write the failing test**

Create `lib/supabase/users.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

import { supabaseAdmin } from "@/lib/supabase/server";
import { getUserByEmail } from "@/lib/supabase/users";

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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- lib/supabase/users.test.ts`
Expected: FAIL — `getUserByEmail is not a function` (not exported yet).

- [ ] **Step 3: Add `getUserByEmail`**

In `lib/supabase/users.ts`, add this function after `getUserByPhone` (keep `getUserByPhone` unchanged):

```ts
/**
 * Busca um usuário pelo email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    throw error;
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- lib/supabase/users.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/users.ts lib/supabase/users.test.ts
git commit -m "feat: add getUserByEmail"
```

---

### Task 5: `/api/users` — email lookup, email-required registration, email patch

**Files:**
- Modify: `app/api/users/route.ts`
- Test: `app/api/users/route.test.ts`

**Interfaces:**
- Consumes: `getUserByPhone`, `getUserByEmail`, `findOrCreateUser`, `updateUser` from `@/lib/supabase/users` (all already exist or were added in Task 4).
- Produces: `GET /api/users?email=` and `GET /api/users?phone=`; `POST /api/users` (400 if `email` missing); `PATCH /api/users` body `{ userId, email? , cpf? }` — consumed by Task 8 (`AuthContext`) and Task 9 (`LoginModal`, both for `?email=` lookup and the `PATCH` link-account call).

- [ ] **Step 1: Write the failing tests**

Create `app/api/users/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/users", () => ({
  getUserByPhone: vi.fn(),
  getUserByEmail: vi.fn(),
  findOrCreateUser: vi.fn(),
  updateUser: vi.fn(),
}));

import {
  getUserByPhone,
  getUserByEmail,
  findOrCreateUser,
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
    expect(findOrCreateUser).not.toHaveBeenCalled();
  });

  it("creates the user when email is present", async () => {
    const payload = { name: "Ana", phone: "5511999999999", email: "ana@example.com" };
    (findOrCreateUser as any).mockResolvedValue({ id: "1", ...payload });

    const req = new NextRequest("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(findOrCreateUser).toHaveBeenCalledWith(payload);
    expect(body.email).toBe("ana@example.com");
  });
});

describe("PATCH /api/users", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when neither cpf nor email is present", async () => {
    const req = new NextRequest("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "1" }),
    });

    const res = await PATCH(req);

    expect(res.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("links an email to an existing user", async () => {
    (updateUser as any).mockResolvedValue({ id: "1", email: "novo@example.com" });

    const req = new NextRequest("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "1", email: "novo@example.com" }),
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(updateUser).toHaveBeenCalledWith("1", { email: "novo@example.com" });
    expect(body.email).toBe("novo@example.com");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/api/users/route.test.ts`
Expected: FAIL — current `GET` requires `phone` unconditionally (400 on the email-based test), `POST` doesn't validate `email`, `PATCH` doesn't accept `email`.

- [ ] **Step 3: Rewrite the route**

Replace the full contents of `app/api/users/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone, getUserByEmail, findOrCreateUser, updateUser } from '@/lib/supabase/users';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone');
  const email = request.nextUrl.searchParams.get('email');

  if (!phone && !email) {
    return NextResponse.json({ error: 'phone ou email obrigatório' }, { status: 400 });
  }

  try {
    const user = email ? await getUserByEmail(email) : await getUserByPhone(phone!);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email) {
      return NextResponse.json({ error: 'email é obrigatório' }, { status: 400 });
    }

    const user = await findOrCreateUser(body);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, cpf, email } = await request.json();

    if (!userId || (!cpf && !email)) {
      return NextResponse.json(
        { error: 'userId e (cpf ou email) são obrigatórios' },
        { status: 400 }
      );
    }

    const updateData: Partial<{ cpf: string; email: string }> = {};
    if (cpf) updateData.cpf = cpf;
    if (email) updateData.email = email;

    const user = await updateUser(userId, updateData);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- app/api/users/route.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/users/route.ts app/api/users/route.test.ts
git commit -m "feat: email lookup, required email on registration, email patch"
```

---

### Task 6: Rewrite `/api/auth/send-code` to use Supabase Auth email OTP

**Files:**
- Modify: `app/api/auth/send-code/route.ts`
- Test: `app/api/auth/send-code/route.test.ts`

**Interfaces:**
- Consumes: `supabaseAdmin.auth.signInWithOtp` from `@/lib/supabase/server`.
- Produces: `POST /api/auth/send-code` body `{ email }` → `{ success: true }` on 200 — consumed by Task 9 (`LoginModal.sendVerificationCode`).

- [ ] **Step 1: Write the failing tests**

Create `app/api/auth/send-code/route.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/api/auth/send-code/route.test.ts`
Expected: FAIL — current route requires `phone`, not `email`.

- [ ] **Step 3: Rewrite the route**

Replace the full contents of `app/api/auth/send-code/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Rate limiting simples em memória: máx 3 tentativas por email a cada 10 min
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 3) return false;

  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });

    if (error) {
      console.error("[SendCode] Erro ao enviar código por email:", error);
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Aguarde alguns segundos antes de solicitar um novo código." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao enviar código de verificação" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado com sucesso",
    });
  } catch (error) {
    console.error("[SendCode] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- app/api/auth/send-code/route.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/send-code/route.ts app/api/auth/send-code/route.test.ts
git commit -m "feat: send login code via Supabase Auth email OTP"
```

---

### Task 7: Rewrite `/api/auth/verify-code` to use Supabase Auth email OTP

**Files:**
- Modify: `app/api/auth/verify-code/route.ts`
- Test: `app/api/auth/verify-code/route.test.ts`

**Interfaces:**
- Consumes: `supabaseAdmin.auth.verifyOtp` from `@/lib/supabase/server`.
- Produces: `POST /api/auth/verify-code` body `{ email, code }` → `{ success: true, verified: true }` on 200 — consumed by Task 9 (`LoginModal.verifyCode`).

- [ ] **Step 1: Write the failing tests**

Create `app/api/auth/verify-code/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { auth: { verifyOtp: vi.fn() } },
}));

import { supabaseAdmin } from "@/lib/supabase/server";
import { POST } from "@/app/api/auth/verify-code/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/verify-code", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/verify-code", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email or code is missing", async () => {
    const res = await POST(makeRequest({ email: "ana@example.com" }));
    expect(res.status).toBe(400);
    expect(supabaseAdmin.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("calls verifyOtp with normalized email and returns 200 on success", async () => {
    (supabaseAdmin.auth.verifyOtp as any).mockResolvedValue({ data: {}, error: null });

    const res = await POST(makeRequest({ email: "  Ana@Example.com ", code: "123456" }));
    const body = await res.json();

    expect(supabaseAdmin.auth.verifyOtp).toHaveBeenCalledWith({
      email: "ana@example.com",
      token: "123456",
      type: "email",
    });
    expect(res.status).toBe(200);
    expect(body.verified).toBe(true);
  });

  it("returns 400 when the code is invalid or expired", async () => {
    (supabaseAdmin.auth.verifyOtp as any).mockResolvedValue({
      data: {},
      error: { status: 400, message: "Token has expired or is invalid" },
    });

    const res = await POST(makeRequest({ email: "ana@example.com", code: "000000" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Código inválido ou expirado");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/api/auth/verify-code/route.test.ts`
Expected: FAIL — current route requires `phone`, not `email`.

- [ ] **Step 3: Rewrite the route**

Replace the full contents of `app/api/auth/verify-code/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email e código são obrigatórios" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { error } = await supabaseAdmin.auth.verifyOtp({
      email: normalizedEmail,
      token: String(code),
      type: "email",
    });

    if (error) {
      console.log("[VerifyCode] Código inválido:", {
        email: normalizedEmail,
        message: error.message,
      });
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 }
      );
    }

    console.log(`[VerifyCode] Código verificado com sucesso para ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Código verificado com sucesso",
    });
  } catch (error) {
    console.error("[VerifyCode] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- app/api/auth/verify-code/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full backend test suite**

Run: `npm test`
Expected: all test files from Tasks 4–7 pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/auth/verify-code/route.ts app/api/auth/verify-code/route.test.ts
git commit -m "feat: verify login code via Supabase Auth email OTP"
```

---

### Task 8: `AuthContext` — switch identity from phone to email

No test framework covers React context/hooks in this repo (no React Testing Library installed, and adding one is out of scope for this plan). This task is verified manually in Task 9's browser walkthrough, since `AuthContext` has no UI of its own.

**Files:**
- Modify: `contexts/AuthContext.tsx`

**Interfaces:**
- Consumes: `User`, `UserFormData` from `@/types/user` (Task 3); `GET /api/users?email=`, `POST /api/users` (Task 5).
- Produces: `useAuth()` returning `{ user, isLoading, login(email: string), register(data: UserFormData), logout(), isAuthenticated, refreshUser() }` — consumed by Task 9 (`LoginModal`) and every other existing consumer of `useAuth` (`HeaderDesktop`, `BottomNav`, `app/perfil/page.tsx`, `app/pedidos/page.tsx`, `ProductCard`, `ProductCardMobile`, `Cart`) which only read `user`/`isAuthenticated`/`logout` and are unaffected by the `login` signature change.

- [ ] **Step 1: Replace the full contents of `contexts/AuthContext.tsx`**

```tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserFormData } from "@/types/user";
import { useCartStore } from "@/store/cartStore";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  register: (data: UserFormData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (typeof window === "undefined") {
          setIsLoading(false);
          return;
        }

        const savedEmail = localStorage.getItem("quiner_user_email");
        if (savedEmail) {
          const res = await fetch(`/api/users?email=${encodeURIComponent(savedEmail)}`);
          const userData: User | null = res.ok ? await res.json() : null;
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem("quiner_user_email");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      const userData: User | null = res.ok ? await res.json() : null;
      if (userData) {
        setUser(userData);
        if (typeof window !== "undefined") {
          localStorage.setItem("quiner_user_email", email);
        }
      } else {
        throw new Error("Usuário não encontrado. Faça o cadastro primeiro.");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: UserFormData) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao registrar usuário');
      const userData: User = await res.json();
      setUser(userData);
      if (typeof window !== "undefined") {
        localStorage.setItem("quiner_user_email", data.email);
      }
    } catch (error) {
      console.error("Erro ao registrar:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("quiner_user_email");
    }
  };

  const refreshUser = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(user.email)}`);
      const userData: User | null = res.ok ? await res.json() : null;
      if (userData) setUser(userData);
    } catch {
      // silencia
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
```

Note: `useCartStore` was imported but unused in the original file too — keep the import as-is (out of scope for this plan; do not remove unrelated pre-existing issues).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors from this file. Remaining errors, if any, should only point at `components/auth/LoginModal.tsx` (fixed in Task 9).

- [ ] **Step 3: Commit**

```bash
git add contexts/AuthContext.tsx
git commit -m "feat: key auth session by email instead of phone"
```

---

### Task 9: `LoginModal` — email login/registration + legacy-account recovery flow

This is a full-file rewrite: the login form switches to email, the register form adds an email field, and a new two-step "recover by phone" flow lets an existing phone-only customer link their first email without creating a duplicate account. Verified manually (no component test framework in this repo).

**Files:**
- Modify: `components/auth/LoginModal.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Task 8) for `login(email)`, `register(data)`, `logout()`; `POST /api/auth/send-code` and `POST /api/auth/verify-code` (Tasks 6–7) generically by email; `GET /api/users?email=`/`?phone=` and `PATCH /api/users` (Task 5).
- Produces: no exported interface consumed elsewhere — this is the modal itself.

- [ ] **Step 1: Replace the full contents of `components/auth/LoginModal.tsx`**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { X, User, Phone, Mail, LogOut, ArrowLeft, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .regex(/^[\d\s()-]+$/, "Telefone inválido"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

const recoverPhoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .regex(/^[\d\s()-]+$/, "Telefone inválido"),
});

const recoverEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type RecoverPhoneFormData = z.infer<typeof recoverPhoneSchema>;
type RecoverEmailFormData = z.infer<typeof recoverEmailSchema>;

type Step = "form" | "recoverPhone" | "recoverEmail" | "verification";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente para input de código de verificação
function CodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const codeLength = 6;

  const handleChange = (index: number, inputValue: string) => {
    const digit = inputValue.replace(/\D/g, "").slice(-1);

    const newValue = value.split("");
    newValue[index] = digit;
    const newCode = newValue.join("").slice(0, codeLength);
    onChange(newCode);

    if (digit && index < codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, codeLength);
    onChange(pastedData);

    const nextIndex = Math.min(pastedData.length, codeLength - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: codeLength }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            value[index] ? "border-primary bg-primary/5" : "border-gray-200 bg-white",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notRegisteredInfo, setNotRegisteredInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { user, isAuthenticated, login, register: registerUser, logout } = useAuth();

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegister,
    setValue: setRegisterValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const {
    register: registerRecoverPhone,
    handleSubmit: handleRecoverPhoneSubmit,
    formState: { errors: recoverPhoneErrors },
    reset: resetRecoverPhone,
  } = useForm<RecoverPhoneFormData>({
    resolver: zodResolver(recoverPhoneSchema),
  });

  const {
    register: registerRecoverEmail,
    handleSubmit: handleRecoverEmailSubmit,
    formState: { errors: recoverEmailErrors },
    reset: resetRecoverEmail,
  } = useForm<RecoverEmailFormData>({
    resolver: zodResolver(recoverEmailSchema),
  });

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  useEffect(() => {
    if (!isOpen) {
      setStep("form");
      setIsRegister(false);
      setVerificationCode("");
      setPendingEmail("");
      setPendingName("");
      setPendingPhone("");
      setLinkingUserId(null);
      setError(null);
      setSuccess(null);
      setNotRegisteredInfo(null);
      setResendCountdown(0);
      resetLogin();
      resetRegister();
      resetRecoverPhone();
      resetRecoverEmail();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const sendVerificationCode = async (email: string) => {
    setIsSendingCode(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar código");
      }

      setStep("verification");
      setResendCountdown(60);
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao enviar código de verificação");
      return false;
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Código inválido");
      }

      return true;
    } catch (err: any) {
      setError(err.message || "Código inválido");
      return false;
    }
  };

  // Login flow: verifica se o email existe -> envia código, ou oferece
  // cadastro/recuperação por telefone
  const onLoginSubmit = async (data: LoginFormData) => {
    const cleanedEmail = data.email.trim().toLowerCase();
    setIsSendingCode(true);
    setError(null);
    setNotRegisteredInfo(null);

    try {
      const userRes = await fetch(`/api/users?email=${encodeURIComponent(cleanedEmail)}`);
      const existingUser = userRes.ok ? await userRes.json() : null;

      if (!existingUser) {
        setIsSendingCode(false);
        setPendingEmail(cleanedEmail);
        setNotRegisteredInfo("Não encontramos uma conta com esse email.");
        return;
      }
    } catch {
      setIsSendingCode(false);
      setPendingEmail(cleanedEmail);
      await sendVerificationCode(cleanedEmail);
      return;
    }

    setIsSendingCode(false);
    setPendingEmail(cleanedEmail);
    await sendVerificationCode(cleanedEmail);
  };

  // Register flow: nome + telefone + email -> envia código
  const onRegisterSubmit = async (data: RegisterFormData) => {
    const cleanedPhone = data.phone.replace(/\D/g, "");
    const cleanedEmail = data.email.trim().toLowerCase();
    setPendingPhone(cleanedPhone);
    setPendingName(data.name);
    setPendingEmail(cleanedEmail);
    setLinkingUserId(null);
    await sendVerificationCode(cleanedEmail);
  };

  // Recuperação passo 1: localiza a conta antiga pelo telefone
  const onRecoverPhoneSubmit = async (data: RecoverPhoneFormData) => {
    const cleanedPhone = data.phone.replace(/\D/g, "");
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/users?phone=${encodeURIComponent(cleanedPhone)}`);
      const foundUser = res.ok ? await res.json() : null;

      if (!foundUser) {
        setError("Não encontramos nenhuma conta com esse telefone. Faça um novo cadastro.");
        setIsLoading(false);
        return;
      }

      setLinkingUserId(foundUser.id);
      setPendingName(foundUser.name);
      setPendingPhone(cleanedPhone);
      setStep("recoverEmail");
    } catch {
      setError("Erro ao buscar sua conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Recuperação passo 2: confirma o email a vincular e envia o código
  const onRecoverEmailSubmit = async (data: RecoverEmailFormData) => {
    const cleanedEmail = data.email.trim().toLowerCase();
    setPendingEmail(cleanedEmail);
    await sendVerificationCode(cleanedEmail);
  };

  // Verifica código e completa login/registro/vínculo de email
  const onVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError("Digite o código completo de 6 dígitos");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await verifyCode();
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      if (linkingUserId) {
        const patchRes = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: linkingUserId, email: pendingEmail }),
        });
        if (!patchRes.ok) {
          throw new Error("Erro ao vincular email à sua conta");
        }
        await login(pendingEmail);
        setSuccess("Email vinculado com sucesso! Login realizado.");
      } else if (isRegister) {
        await registerUser({
          name: pendingName,
          phone: pendingPhone,
          email: pendingEmail,
        });
        setSuccess("Cadastro realizado com sucesso! Bem-vindo!");
      } else {
        await login(pendingEmail);
        setSuccess("Login realizado com sucesso!");
      }

      resetLogin();
      resetRegister();
      resetRecoverPhone();
      resetRecoverEmail();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao completar autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    await sendVerificationCode(pendingEmail);
  };

  const handleBackFromVerification = () => {
    setStep(linkingUserId ? "recoverEmail" : "form");
    setVerificationCode("");
    setError(null);
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setIsRegister(false);
    setStep("form");
    setVerificationCode("");
    setPendingEmail("");
    setPendingName("");
    setPendingPhone("");
    setLinkingUserId(null);
    resetLogin();
    resetRegister();
    resetRecoverPhone();
    resetRecoverEmail();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] md:z-[130] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5 text-secondary" />
        </button>

        {/* Back Button */}
        {(step === "verification" || step === "recoverPhone" || step === "recoverEmail") &&
          !isAuthenticated && (
            <button
              onClick={() => {
                if (step === "verification") {
                  handleBackFromVerification();
                } else if (step === "recoverEmail") {
                  setStep("recoverPhone");
                  setError(null);
                } else if (step === "recoverPhone") {
                  setStep("form");
                  setError(null);
                }
              }}
              className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
            >
              <ArrowLeft className="w-5 h-5 text-secondary" />
            </button>
          )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-600 text-sm font-medium text-center">{success}</p>
          </div>
        )}

        {/* Authenticated Profile View */}
        {isAuthenticated && user ? (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-dark">Meu Perfil</h2>
              <p className="text-secondary/60 text-sm">Suas informações de conta</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-secondary/50 font-medium uppercase tracking-wide">Nome</p>
                  <p className="text-lg font-semibold text-secondary-dark">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-dark rounded-xl flex items-center justify-center shadow-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-secondary/50 font-medium uppercase tracking-wide">Email</p>
                  <p className="text-lg font-semibold text-secondary-dark">
                    {user.email || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-dark rounded-xl flex items-center justify-center shadow-lg">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-secondary/50 font-medium uppercase tracking-wide">Telefone</p>
                  <p className="text-lg font-semibold text-secondary-dark">
                    {formatPhone(user.phone)}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair da Conta
            </button>
          </div>
        ) : step === "verification" ? (
          /* Verification Step */
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-dark mb-2">
                Verificação
              </h2>
              <p className="text-secondary/60 text-sm">
                Enviamos um código de 6 dígitos para o email
              </p>
              <p className="text-primary font-semibold mt-1">
                {pendingEmail}
              </p>
            </div>

            <div className="space-y-4">
              <CodeInput
                value={verificationCode}
                onChange={setVerificationCode}
                disabled={isLoading}
              />

              <button
                onClick={onVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2",
                  verificationCode.length === 6 && !isLoading
                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-xl"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verificar Código"
                )}
              </button>
            </div>

            <div className="text-center">
              {resendCountdown > 0 ? (
                <p className="text-sm text-secondary/60">
                  Reenviar código em <span className="font-semibold text-primary">{resendCountdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={isSendingCode}
                  className="text-sm text-primary font-medium hover:underline flex items-center justify-center gap-2 mx-auto"
                >
                  {isSendingCode ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Reenviar código
                </button>
              )}
            </div>

            <p className="text-xs text-secondary/50 text-center">
              Todas as atualizações dos seus pedidos serão enviadas pelo WhatsApp
            </p>
          </div>
        ) : step === "recoverPhone" ? (
          /* Recover step 1: locate old account by phone */
          <form onSubmit={handleRecoverPhoneSubmit(onRecoverPhoneSubmit)} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-dark">Já tenho conta</h2>
              <p className="text-secondary/60 text-sm">
                Digite o telefone que você usava para localizar sua conta
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Telefone (WhatsApp)
              </label>
              <Input
                {...registerRecoverPhone("phone")}
                type="tel"
                placeholder="(00) 00000-0000"
                className={cn(
                  "h-12 rounded-xl",
                  recoverPhoneErrors.phone && "border-red-500"
                )}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  e.target.value = formatted;
                  registerRecoverPhone("phone").onChange(e);
                }}
              />
              {recoverPhoneErrors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {recoverPhoneErrors.phone.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2",
                "bg-gradient-to-r from-primary to-primary-dark text-white",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "disabled:opacity-70 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Localizar conta"
              )}
            </button>
          </form>
        ) : step === "recoverEmail" ? (
          /* Recover step 2: confirm the email to link */
          <form onSubmit={handleRecoverEmailSubmit(onRecoverEmailSubmit)} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-dark">Confirme seu email</h2>
              <p className="text-secondary/60 text-sm">
                {pendingName ? `Encontramos sua conta, ${pendingName.split(" ")[0]}! ` : ""}
                Cadastre um email para entrar a partir de agora
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Email
              </label>
              <Input
                {...registerRecoverEmail("email")}
                type="email"
                placeholder="seu@email.com"
                className={cn(
                  "h-12 rounded-xl",
                  recoverEmailErrors.email && "border-red-500"
                )}
              />
              {recoverEmailErrors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {recoverEmailErrors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSendingCode}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2",
                "bg-gradient-to-r from-primary to-primary-dark text-white",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "disabled:opacity-70 disabled:cursor-not-allowed"
              )}
            >
              {isSendingCode ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando código...
                </>
              ) : (
                "Enviar código"
              )}
            </button>
          </form>
        ) : isRegister ? (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-dark">Cadastre-se</h2>
              <p className="text-secondary/60 text-sm">Preencha seus dados para continuar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Nome completo
              </label>
              <Input
                {...registerForm("name")}
                type="text"
                placeholder="Seu nome"
                className={cn(
                  "h-12 rounded-xl",
                  registerErrors.name && "border-red-500"
                )}
              />
              {registerErrors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {registerErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Telefone (WhatsApp)
              </label>
              <Input
                {...registerForm("phone")}
                type="tel"
                placeholder="(00) 00000-0000"
                className={cn(
                  "h-12 rounded-xl",
                  registerErrors.phone && "border-red-500"
                )}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  e.target.value = formatted;
                  registerForm("phone").onChange(e);
                }}
              />
              {registerErrors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {registerErrors.phone.message}
                </p>
              )}
              <p className="text-xs text-secondary/50 mt-1">
                Usaremos para as atualizações do seu pedido via WhatsApp
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Email
              </label>
              <Input
                {...registerForm("email")}
                type="email"
                placeholder="seu@email.com"
                className={cn(
                  "h-12 rounded-xl",
                  registerErrors.email && "border-red-500"
                )}
              />
              {registerErrors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {registerErrors.email.message}
                </p>
              )}
              <p className="text-xs text-secondary/50 mt-1">
                Você receberá um código de verificação neste email
              </p>
            </div>

            <button
              type="submit"
              disabled={isSendingCode}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2",
                "bg-gradient-to-r from-primary to-primary-dark text-white",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "disabled:opacity-70 disabled:cursor-not-allowed"
              )}
            >
              {isSendingCode ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando código...
                </>
              ) : (
                "Continuar"
              )}
            </button>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-dark">Entrar</h2>
              <p className="text-secondary/60 text-sm">Digite seu email para continuar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Email
              </label>
              <Input
                {...registerLogin("email")}
                type="email"
                placeholder="seu@email.com"
                className={cn(
                  "h-12 rounded-xl",
                  loginErrors.email && "border-red-500"
                )}
              />
              {loginErrors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {loginErrors.email.message}
                </p>
              )}
              <p className="text-xs text-secondary/50 mt-1">
                Você receberá um código de verificação neste email
              </p>
            </div>

            {notRegisteredInfo && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <p className="text-amber-700 text-sm text-center font-medium">{notRegisteredInfo}</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setNotRegisteredInfo(null);
                      resetRegister();
                      setRegisterValue("email", pendingEmail);
                    }}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Criar conta com esse email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotRegisteredInfo(null);
                      setStep("recoverPhone");
                    }}
                    className="w-full py-2.5 rounded-xl border-2 border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
                  >
                    Já sou cliente, localizar por telefone
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSendingCode}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2",
                "bg-gradient-to-r from-primary to-primary-dark text-white",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "disabled:opacity-70 disabled:cursor-not-allowed"
              )}
            >
              {isSendingCode ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando código...
                </>
              ) : (
                "Continuar"
              )}
            </button>
          </form>
        )}

        {/* Toggle Login/Register */}
        {!isAuthenticated && step === "form" && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                setNotRegisteredInfo(null);
                resetLogin();
                resetRegister();
              }}
              className="text-sm text-primary font-medium hover:underline"
            >
              {isRegister
                ? "Já tem conta? Faça login"
                : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual browser walkthrough**

Run `npm run dev`, open the app, and click "Conta" from the home page (unauthenticated) to open the modal. Walk through all four paths:

1. **New user registration:** click "Não tem conta? Cadastre-se", fill name/phone/email, submit, enter the 6-digit code received by email, confirm the modal shows the authenticated profile view with name/email/phone.
2. **Returning user login:** log out, reopen the modal, log in with the same email, confirm the code arrives and login succeeds.
3. **Legacy account recovery:** in Supabase, manually pick (or insert) a `users` row with `phone` set and `email` NULL. In the modal, try logging in with any email — get "Não encontramos uma conta com esse email", click "Já sou cliente, localizar por telefone", enter that row's phone, confirm it moves to "Confirme seu email", enter an email, verify the code, and confirm in Supabase that the **same row** (same `id`) now has that email set (not a new row).
4. **Unknown phone during recovery:** in step 3's phone screen, enter a phone with no matching row — confirm the inline error appears and no navigation happens.

- [ ] **Step 4: Commit**

```bash
git add components/auth/LoginModal.tsx
git commit -m "feat: email login/registration with legacy phone-account recovery"
```

---

### Task 10: Update `CLAUDE.md` documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the "Authentication Flow" section**

In `CLAUDE.md`, replace the existing `### Authentication Flow` section (the one describing "WhatsApp Verification") with:

```markdown
### Authentication Flow

**Email Verification (Supabase Auth OTP)**:
1. User enters email on the login form (registration also requires name + phone)
2. API `/api/auth/send-code` calls Supabase Auth's `signInWithOtp({ email })`, which generates and emails a 6-digit code (Supabase-managed, no custom email code in this repo)
3. User enters the code, API `/api/auth/verify-code` calls `verifyOtp({ email, token, type: "email" })`
4. On success, the app resolves the user by email against its own `users` table (the Supabase Auth session returned by `verifyOtp` is discarded — the app keeps its own `localStorage`-based session, keyed by `quiner_user_email`)
5. Existing phone-only accounts (pre-email) are linked to a new email via the "recover by phone" flow in `LoginModal`, which `PATCH`es the existing `users` row instead of creating a duplicate

Phone remains required at registration and continues to power WhatsApp order notifications, delivery reminders, and the admin product-registration bot — none of that uses the login verification code.
```

- [ ] **Step 2: Update the `AuthContext` line in the State Management section**

Find this line (currently line 26):

```markdown
   - `AuthContext` - Phone-based authentication with localStorage persistence (key: `quiner_user_phone`)
```

Replace it with:

```markdown
   - `AuthContext` - Email-based authentication (Supabase Auth OTP) with localStorage persistence (key: `quiner_user_email`)
```

- [ ] **Step 3: Update the "Known Issues & Technical Debt" item**

Find this line (currently line 202):

```markdown
3. **Phone-based auth**: Uses phone numbers with WhatsApp verification codes (no email/password)
```

Replace it with:

```markdown
3. **Email-based auth**: Uses email with Supabase Auth OTP codes (no password); phone stays required for WhatsApp order notifications
```

- [ ] **Step 4: Add `User`/`UserFormData` to the "Key Types" section**

Find this block (currently lines 152-157):

```markdown
**Key Types**:
```typescript
CartItem = { product: Product; quantity: number; }
Order = { id, user_id, items: OrderItem[], total, status, payment_method, address_data, ... }
OrderStatus = "novo" | "preparando" | "saiu_entrega" | "entregue" | "cancelado"
```
```

Replace it with:

```markdown
**Key Types**:
```typescript
User = { id, name, phone, email: string | null, cpf?, created_at, updated_at }
UserFormData = { name, phone, email }  // email required on registration
CartItem = { product: Product; quantity: number; }
Order = { id, user_id, items: OrderItem[], total, status, payment_method, address_data, ... }
OrderStatus = "novo" | "preparando" | "saiu_entrega" | "entregue" | "cancelado"
```
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for email OTP auth flow"
```

---

## Post-plan manual steps (not part of any task — done by the project owner)

1. In the Supabase dashboard (Authentication → Email Templates → Magic Link), replace the template body to expose `{{ .Token }}` as a 6-digit code instead of a link (suggested HTML is in the design spec).
2. When ready for real production volume, configure Custom SMTP (Authentication → Settings → SMTP) with any provider — no code changes required.
3. Deploy to Vercel production, as requested separately by the user.
