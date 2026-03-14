import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_SUBDOMAIN = "painel.quiner.com.br";
// Domínios com acesso irrestrito ao app (beta, preview, staging)
const DOMINIOS_LIBERADOS = ["quinersorvetes-beta.vercel.app"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  const isLocalhost =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isAdminSubdomain =
    hostname === ADMIN_SUBDOMAIN || hostname.startsWith(`${ADMIN_SUBDOMAIN}:`);
  const isDominioLiberado = DOMINIOS_LIBERADOS.some(
    (d) => hostname === d || hostname.startsWith(`${d}:`)
  );

  // Localhost e domínios beta/preview: acesso total sem restrição
  if (isLocalhost || isDominioLiberado) {
    return NextResponse.next();
  }

  // Rotas de sistema sempre liberadas (Next.js internals + API)
  if (pathname.startsWith("/_next/") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Painel admin: acessível apenas no subdomínio correto (ou localhost em dev)
  if (pathname.startsWith("/gestao-admin")) {
    if (isLocalhost || isAdminSubdomain) {
      return NextResponse.next();
    }
    // Qualquer outro domínio tentando acessar /gestao-admin → inauguração
    return NextResponse.redirect(new URL("/inauguracao", request.url));
  }

  // Página de inauguração: sempre acessível (evita loop)
  if (pathname.startsWith("/inauguracao")) {
    return NextResponse.next();
  }

  // Tudo o mais → inauguração
  return NextResponse.redirect(new URL("/inauguracao", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|browser-polyfill.js|suppress-extension-errors.js).*)",
  ],
};
