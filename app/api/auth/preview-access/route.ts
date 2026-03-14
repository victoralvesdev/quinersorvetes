import { NextRequest, NextResponse } from "next/server";

// Telefone autorizado a acessar o site antes da inauguração
const TELEFONE_AUTORIZADO = (process.env.PREVIEW_ACCESS_PHONE || "11995410041").replace(/\D/g, "");

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    const phoneLimpo = String(phone || "").replace(/\D/g, "");

    if (phoneLimpo !== TELEFONE_AUTORIZADO) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("quiner_preview", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erro ao verificar acesso." }, { status: 500 });
  }
}
