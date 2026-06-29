"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "../_lib/auth";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Coquille des pages authentifiées du groupe `(home)` : sidebar + topbar.
 * Protection côté client (défense complémentaire au `proxy.ts`) : redirige
 * vers `/login` si la session n'est pas authentifiée.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // En cours de vérification ou redirection imminente.
  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
