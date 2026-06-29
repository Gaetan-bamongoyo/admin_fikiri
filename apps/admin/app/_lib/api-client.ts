/**
 * Client HTTP minimal et typé pour l'API Fikiri.
 *
 * La base est lue depuis `NEXT_PUBLIC_API_URL` (préfixe `/api/v1` inclus) ;
 * à défaut, on retombe sur l'API locale de développement.
 */
import { clearAuth, getToken } from "./auth-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7540/api/v1";

/** Erreur levée pour toute réponse HTTP non 2xx. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Accepte tout objet typé ; les valeurs sont converties en chaîne, `undefined`/`null` ignorées. */
type QueryParams = Record<string, unknown>;

interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Paramètres de query string ; les valeurs `undefined`/`null` sont ignorées. */
  params?: QueryParams;
  /** Corps de requête sérialisé en JSON automatiquement. */
  body?: unknown;
}

function buildUrl(path: string, params?: QueryParams): string {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  const url = new URL(path.replace(/^\//, ""), base);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function apiFetch<T>(
  path: string,
  { params, body, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const token = getToken();

  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Session expirée / invalide : on purge et on renvoie vers la connexion.
    if (response.status === 401 && !path.includes("/auth/")) {
      clearAuth();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    const message =
      isJson && payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : response.statusText || "Échec de la requête";
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

/** Raccourcis par méthode HTTP. */
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};
