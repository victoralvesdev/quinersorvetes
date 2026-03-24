import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("quiner_admin_session")?.value;

  if (session === "1") {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
