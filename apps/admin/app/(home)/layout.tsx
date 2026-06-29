import type { ReactNode } from "react";

import { AppShell } from "@/app/_components/app-shell";

/**
 * Layout des pages authentifiées (tableau de bord, carte, courses, …).
 * Le `proxy.ts` bloque déjà l'accès sans session ; la coquille assure la
 * protection côté client et l'affichage (sidebar + topbar).
 */
export default function HomeLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
