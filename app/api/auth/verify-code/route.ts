import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  getUserByEmail,
  getUserByPhone,
  updateUser,
  registerUserByEmail,
} from "@/lib/supabase/users";

type Action = "login" | "register" | "link";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, action, name, phone } = body as {
      email?: string;
      code?: string;
      action?: Action;
      name?: string;
      phone?: string;
    };

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

    if (action === "register") {
      if (!name || !phone) {
        return NextResponse.json(
          { error: "Nome e telefone são obrigatórios" },
          { status: 400 }
        );
      }

      const cleanedPhone = String(phone).replace(/\D/g, "");
      const result = await registerUserByEmail({
        name,
        phone: cleanedPhone,
        email: normalizedEmail,
      });

      if (result.status === "phone_conflict") {
        return NextResponse.json(
          {
            error:
              "Esse telefone já está cadastrado. Use 'Já sou cliente, localizar por telefone' para vincular seu email.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ success: true, verified: true, user: result.user });
    }

    if (action === "link") {
      if (!phone) {
        return NextResponse.json(
          { error: "Telefone é obrigatório" },
          { status: 400 }
        );
      }

      const cleanedPhone = String(phone).replace(/\D/g, "");
      const foundUser = await getUserByPhone(cleanedPhone);

      if (!foundUser) {
        return NextResponse.json(
          { error: "Não encontramos nenhuma conta com esse telefone." },
          { status: 404 }
        );
      }

      const updated = await updateUser(foundUser.id, { email: normalizedEmail });
      return NextResponse.json({ success: true, verified: true, user: updated });
    }

    // action === "login" (default)
    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, verified: true, user });
  } catch (error) {
    console.error("[VerifyCode] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
