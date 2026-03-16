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

  const hasPreviewAccess =
    request.cookies.get("quiner_preview")?.value === "1";

  // Localhost, domínios beta/preview e usuário autorizado: acesso total
  if (isLocalhost || isDominioLiberado || hasPreviewAccess) {
    return NextResponse.next();
  }

  // Rotas de sistema sempre liberadas (Next.js internals + API)
  if (pathname.startsWith("/_next/") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Painel admin: acessível apenas no subdomínio correto
  if (pathname.startsWith("/gestao-admin")) {
    if (isAdminSubdomain) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|browser-polyfill.js|suppress-extension-errors.js).*)",
  ],
};
