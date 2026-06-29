import { SettingsPanel } from "@/app/_components/settings-panel";

export default function ParametresPage() {
  return (
    <>
      {/* En-tête de page */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérer les paramètres de la plateforme
        </p>
      </div>

      <SettingsPanel />
    </>
  );
}
