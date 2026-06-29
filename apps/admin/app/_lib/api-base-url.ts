"use client";

/**
 * Résout l'URL de base de l'API REST (`/api/v1` inclus).
 *
 * En production HTTPS, si l'upstream est en HTTP (ex. IP:7540), on passe par le
 * proxy same-origin de Next.js (`/api/v1`) pour éviter le blocage mixed content.
 */
export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7540/api/v1";
  const normalized = configured.replace(/\/$/, "");

  const useSameOriginProxy =
    window.location.protocol === "https:" &&
    normalized.startsWith("http://") &&
    !normalized.includes("localhost");

  if (useSameOriginProxy) {
    return `${window.location.origin}/api/v1`;
  }

  return normalized;
}

/** Origine du serveur (REST + Socket.IO). */
export function getApiOrigin(): string {
  return new URL(getApiBaseUrl()).origin;
}
