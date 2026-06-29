"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Car, Eye, EyeOff, Loader2 } from "lucide-react";

import { ApiError } from "@/app/_lib/api-client";
import { useAuth } from "@/app/_lib/auth";
import { clearAuth } from "@/app/_lib/auth-storage";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role !== "admin") {
        clearAuth();
        setError("Accès réservé aux administrateurs.");
        return;
      }
      // Revient sur la page demandée avant la redirection du proxy, sinon
      // le tableau de bord. On reste sur une destination interne par sécurité.
      const target = new URLSearchParams(window.location.search).get("redirect");
      router.replace(target && target.startsWith("/") ? target : "/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Email ou mot de passe incorrect."
          : "Connexion impossible. Réessayez.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0c12] p-4 text-white">
      {/* Lueur d'ambiance, fidèle à la maquette */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[12%] size-[420px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]"
      />

      {/* En-tête marque */}
      <div className="absolute left-6 top-6 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
          <Car className="size-5" />
        </div>
        <span className="text-base font-semibold tracking-tight">
          Fikiri Traffic
        </span>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Lanyard / accent suspendu */}
        <div className="flex flex-col items-center">
          <span className="h-20 w-[3px] rounded-full bg-linear-to-b from-transparent via-brand to-brand shadow-[0_0_12px] shadow-brand/60" />
          <span className="-mb-3 h-3 w-12 rounded-full bg-white/10 ring-1 ring-white/10" />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/3 p-8 shadow-2xl backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Se connecter</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm text-white/50">
              Accédez à votre tableau de bord et gérez votre trafic en toute
              simplicité.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-white/80"
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="admin@fikiri.cd"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white placeholder:text-white/30 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-white/80"
                >
                  Mot de passe
                </label>
                <a
                  href="mailto:support@fikiri.cd?subject=Mot%20de%20passe%20oublié"
                  className="text-sm font-medium text-brand hover:text-brand/80"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 pr-11 text-sm text-white placeholder:text-white/30 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-white/70">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 rounded border-white/20 bg-white/4 text-brand accent-brand focus:ring-brand/40"
              />
              Se souvenir de moi
            </label>

            {error ? (
              <p className="rounded-xl bg-destructive/15 px-4 py-2.5 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-colors hover:bg-brand/90 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-white/40">
            <span className="h-px flex-1 bg-white/10" />
            Nouveau sur Fikiri Traffic ?
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <a
            href="mailto:support@fikiri.cd?subject=Création%20de%20compte"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#0a0c12] transition-opacity hover:opacity-90"
          >
            Créer un compte
          </a>
        </div>
      </div>

      <p className="relative z-10 mt-8 text-sm text-white/40">
        Pour assistance, contactez{" "}
        <a
          href="mailto:support@fikiri.cd"
          className="font-medium text-brand hover:text-brand/80"
        >
          support@fikiri.cd
        </a>
      </p>
    </div>
  );
}
