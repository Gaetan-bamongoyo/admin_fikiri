import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Garde de routage côté serveur (ancien `middleware.ts`, renommé `proxy` dans
 * cette version de Next.js). Exécuté avant le rendu de chaque route ciblée par
 * le `matcher`.
 *
 * Règle : la présence du cookie de session `fikiri_admin_token` (posé par
 * `app/_lib/auth-storage.ts`) conditionne l'accès.
 *  - Sans session → toute page protégée renvoie vers `/login` (avec l'URL
 *    d'origine en `redirect` pour revenir après connexion).
 *  - Avec session → `/login` renvoie vers le tableau de bord.
 *
 * La vérification du rôle administrateur reste assurée par l'API et le client ;
 * le proxy ne fait qu'une garde de présence, sans secret côté Edge.
 */
const AUTH_COOKIE_NAME = "fikiri_admin_token";
const LOGIN_PATH = "/login";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isLoginRoute = pathname === LOGIN_PATH;

  // Déjà connecté : on ne reste pas sur la page de connexion.
  if (isLoginRoute) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Route protégée sans session : redirection vers la connexion.
  if (!hasSession) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Applique le proxy à toutes les routes sauf :
   * - les routes d'API
   * - les fichiers statiques et l'optimisation d'images de Next.js
   * - les fichiers de métadonnées et assets racine courants
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
