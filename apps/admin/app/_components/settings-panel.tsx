"use client";

import { useState } from "react";
import { Globe, Loader2, Palette } from "lucide-react";

import { Card } from "@fikiri/ui/components/card";
import { Input } from "@fikiri/ui/components/input";
import { Label } from "@fikiri/ui/components/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@fikiri/ui/components/native-select";
import { Separator } from "@fikiri/ui/components/separator";
import { Switch } from "@fikiri/ui/components/switch";
import { toast } from "@fikiri/ui/components/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@fikiri/ui/components/tabs";
import { Textarea } from "@fikiri/ui/components/textarea";

import { ApiError } from "@/app/_lib/api-client";
import {
  useSettings,
  useUpdateSettings,
  type UpdateSettingsInput,
} from "@/app/_lib/queries/settings";

const tabs = [
  { value: "general", label: "Général" },
  { value: "notifications", label: "Notifications" },
  { value: "securite", label: "Sécurité" },
  { value: "systeme", label: "Système" },
];

const EMPTY_FORM: UpdateSettingsInput = {
  appName: "",
  appDescription: "",
  language: "fr",
  timezone: "Africa/Kinshasa",
  maintenanceMode: false,
  publicSignupEnabled: true,
};

/** Couleurs de la charte UNDP. */
const undpColors = [
  { hex: "#0468B1", color: "#0468B1" },
  { hex: "#61CDDA", color: "#61CDDA" },
  { hex: "#F99D26", color: "#F99D26" },
  { hex: "#27AE60", color: "#27AE60" },
  { hex: "#D12C2C", color: "#D12C2C" },
];

function toForm(data: NonNullable<ReturnType<typeof useSettings>["data"]>): UpdateSettingsInput {
  return {
    appName: data.appName,
    appDescription: data.appDescription ?? "",
    language: data.language,
    timezone: data.timezone,
    maintenanceMode: data.maintenanceMode,
    publicSignupEnabled: data.publicSignupEnabled,
  };
}

export function SettingsPanel() {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<UpdateSettingsInput>(EMPTY_FORM);

  // Synchronise le formulaire dès que les paramètres sont chargés, sans effet.
  const [syncedData, setSyncedData] = useState(settings.data);
  if (settings.data && settings.data !== syncedData) {
    setSyncedData(settings.data);
    setForm(toForm(settings.data));
  }

  function set<K extends keyof UpdateSettingsInput>(
    key: K,
    value: UpdateSettingsInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    if (settings.data) {
      setForm(toForm(settings.data));
    }
  }

  async function save() {
    try {
      await updateSettings.mutateAsync(form);
      toast.success("Paramètres enregistrés");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Échec de l'enregistrement des paramètres"
      );
    }
  }

  return (
    <Tabs defaultValue="general" className="gap-6">
      <TabsList className="h-9">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="px-3">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        {/* Paramètres généraux */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Globe className="size-5 text-muted-foreground" />
            Paramètres Généraux
          </h2>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="app-name">Nom de l&apos;application</Label>
              <Input
                id="app-name"
                value={form.appName ?? ""}
                onChange={(e) => set("appName", e.target.value)}
                className="bg-muted/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-description">Description</Label>
              <Textarea
                id="app-description"
                rows={3}
                value={form.appDescription ?? ""}
                onChange={(e) => set("appDescription", e.target.value)}
                className="bg-muted/40"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <NativeSelect
                  id="language"
                  value={form.language ?? "fr"}
                  onChange={(e) => set("language", e.target.value)}
                  className="w-full bg-muted/40"
                >
                  <NativeSelectOption value="fr">Français</NativeSelectOption>
                  <NativeSelectOption value="en">English</NativeSelectOption>
                  <NativeSelectOption value="ln">Lingala</NativeSelectOption>
                </NativeSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <NativeSelect
                  id="timezone"
                  value={form.timezone ?? "Africa/Kinshasa"}
                  onChange={(e) => set("timezone", e.target.value)}
                  className="w-full bg-muted/40"
                >
                  <NativeSelectOption value="Africa/Kinshasa">
                    Africa/Kinshasa (WAT)
                  </NativeSelectOption>
                  <NativeSelectOption value="Africa/Lubumbashi">
                    Africa/Lubumbashi (CAT)
                  </NativeSelectOption>
                  <NativeSelectOption value="UTC">UTC</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Mode Maintenance
                </p>
                <p className="text-sm text-muted-foreground">
                  Activer le mode maintenance pour la plateforme
                </p>
              </div>
              <Switch
                checked={form.maintenanceMode ?? false}
                onCheckedChange={(v) => set("maintenanceMode", v)}
                aria-label="Mode maintenance"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Inscriptions Publiques
                </p>
                <p className="text-sm text-muted-foreground">
                  Permettre aux nouveaux utilisateurs de s&apos;inscrire
                </p>
              </div>
              <Switch
                checked={form.publicSignupEnabled ?? true}
                onCheckedChange={(v) => set("publicSignupEnabled", v)}
                aria-label="Inscriptions publiques"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={reset}
                disabled={updateSettings.isPending}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={save}
                disabled={updateSettings.isPending || settings.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand/90 disabled:opacity-50"
              >
                {updateSettings.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Enregistrer
              </button>
            </div>
          </div>
        </Card>

        {/* Apparence */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Palette className="size-5 text-muted-foreground" />
            Apparence
          </h2>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="theme">Thème</Label>
              <NativeSelect
                id="theme"
                defaultValue="clair"
                className="w-full bg-muted/40"
              >
                <NativeSelectOption value="clair">Clair</NativeSelectOption>
                <NativeSelectOption value="sombre">Sombre</NativeSelectOption>
                <NativeSelectOption value="systeme">Système</NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label>Couleurs principales (UNDP)</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {undpColors.map((c) => (
                  <div key={c.hex} className="space-y-1.5">
                    <div
                      className="h-16 rounded-lg border border-border"
                      style={{ backgroundColor: c.color }}
                    />
                    <p className="text-center text-xs text-muted-foreground">
                      {c.hex}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </TabsContent>

      {tabs
        .filter((t) => t.value !== "general")
        .map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card className="flex h-48 items-center justify-center p-6">
              <p className="text-sm text-muted-foreground">
                Les paramètres « {tab.label} » seront bientôt disponibles.
              </p>
            </Card>
          </TabsContent>
        ))}
    </Tabs>
  );
}
