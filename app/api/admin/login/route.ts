import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("[admin/login] ADMIN_PASSWORD não configurado");
    return NextResponse.json({ success: false }, { status: 500 });
  }

  if (password !== adminPassword) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("quiner_admin_session", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });

  return response;
}
