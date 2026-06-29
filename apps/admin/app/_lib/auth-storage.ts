/**
 * Stockage du jeton d'authentification (localStorage). Module pur, sans React,
 * pour être réutilisable par l'`api-client` sans dépendance circulaire.
 */
const TOKEN_KEY = "fikiri_admin_token";
const USER_KEY = "fikiri_admin_user";

/**
 * Le jeton est aussi déposé en cookie (en plus du localStorage) afin que le
 * `proxy.ts` puisse protéger les routes côté serveur, avant tout rendu. Cookie
 * non-`HttpOnly` (posé en JS) : sa présence sert uniquement de garde de routage,
 * la vérification du rôle reste assurée par l'API et le client.
 */
const COOKIE_NAME = "fikiri_admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function setTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function clearTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: "user" | "admin";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  setTokenCookie(token);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  clearTokenCookie();
}

/** Nom du cookie de session lu par le `proxy.ts`. */
export { COOKIE_NAME as AUTH_COOKIE_NAME };
