import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_SUBDOMAIN = "painel.quiner.com.br";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Verifica se está acessando rotas de admin
  if (pathname.startsWith("/gestao-admin")) {
    // Em desenvolvimento, permite acesso local
    const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");

    // Verifica se está no subdomínio correto
    const isAdminSubdomain = hostname === ADMIN_SUBDOMAIN || hostname.startsWith(`${ADMIN_SUBDOMAIN}:`);

    // Se não for localhost e não for o subdomínio admin, retorna 404
    if (!isLocalhost && !isAdminSubdomain) {
      const url = request.nextUrl.clone();
      url.pathname = "/not-found-page";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/gestao-admin/:path*"],
};
