"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/_lib/auth";

/**
 * Layout des pages d'authentification (connexion). Rendu plein écran, sans
 * coquille. Si une session valide existe déjà, on renvoie vers le tableau de
 * bord (en complément de la redirection assurée par `proxy.ts`).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  return <>{children}</>;
}
