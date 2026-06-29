"use client";

import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@fikiri/ui/components/dialog";
import { cn } from "@fikiri/ui/lib/utils";

import { formatDateTime } from "@/app/_lib/presentation";
import { useUser, type UserPreferences } from "@/app/_lib/queries/users";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        value
          ? "bg-traffic-fluide/15 text-traffic-fluide"
          : "bg-muted text-muted-foreground"
      )}
    >
      {value ? "Activé" : "Désactivé"}
    </span>
  );
}

function coords(lat?: string | null, lng?: string | null): string {
  if (!lat || !lng) return "Non défini";
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

function Preferences({ prefs }: { prefs: UserPreferences }) {
  return (
    <div className="divide-y divide-border">
      <Row label="Domicile" value={coords(prefs.homeLatitude, prefs.homeLongitude)} />
      <Row label="Travail" value={coords(prefs.workLatitude, prefs.workLongitude)} />
      <Row label="Moyen de recherche" value={prefs.searchMetro} />
      <Row label="Notifications" value={<BoolBadge value={prefs.notificationsEnabled} />} />
      <Row
        label="Alertes anticipées"
        value={<BoolBadge value={prefs.anticipatoryAlertsEnabled} />}
      />
      <Row
        label="Anonymiser la position"
        value={<BoolBadge value={prefs.anonymizePositionData} />}
      />
      <Row
        label="Alertes trafic régional"
        value={<BoolBadge value={prefs.trafficRegionAlertsEnabled} />}
      />
      <Row
        label="Alertes incidents trajet"
        value={<BoolBadge value={prefs.routeIncidentAlertsEnabled} />}
      />
      <Row
        label="Rappel de départ"
        value={`${prefs.departureReminderMinutes} min`}
      />
      <Row
        label="Alertes trafic domicile"
        value={<BoolBadge value={prefs.homeTrafficAlertsEnabled} />}
      />
      <Row
        label="Alertes trafic travail"
        value={<BoolBadge value={prefs.workTrafficAlertsEnabled} />}
      />
    </div>
  );
}

export function UserDetailDialog({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const { data, isPending, isError } = useUser(userId);

  return (
    <Dialog open={userId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {data
              ? [data.firstName, data.lastName].filter(Boolean).join(" ") ||
                data.email
              : "Détails de l'utilisateur"}
          </DialogTitle>
          <DialogDescription>
            Informations du compte et préférences de mobilité (lecture seule).
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !data ? (
          <p className="py-8 text-center text-sm text-destructive">
            Impossible de charger l&apos;utilisateur.
          </p>
        ) : (
          <div className="space-y-5">
            <section>
              <h3 className="mb-1 text-sm font-semibold text-foreground">
                Compte
              </h3>
              <div className="divide-y divide-border">
                <Row label="Email" value={data.email} />
                <Row label="Téléphone" value={data.phone ?? "—"} />
                <Row
                  label="Rôle"
                  value={data.role === "admin" ? "Admin" : "Utilisateur"}
                />
                <Row label="Points de fidélité" value={data.loyaltyPoints} />
                <Row
                  label="Inscription"
                  value={formatDateTime(data.createdAt).date}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold text-foreground">
                Préférences de mobilité
              </h3>
              {data.preferences ? (
                <Preferences prefs={data.preferences} />
              ) : (
                <p className="py-3 text-sm text-muted-foreground">
                  Aucune préférence enregistrée.
                </p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
