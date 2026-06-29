"use client";

import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@fikiri/ui/components/dialog";
import { cn } from "@fikiri/ui/lib/utils";

import { formatDateTime, incidentTypeLabel } from "@/app/_lib/presentation";
import {
  useIncident,
  useIncidentConfirmations,
} from "@/app/_lib/queries/incidents";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function IncidentDetailDialog({
  incidentId,
  onClose,
}: {
  incidentId: string | null;
  onClose: () => void;
}) {
  const incident = useIncident(incidentId);
  const confirmations = useIncidentConfirmations(incidentId);

  const confirmed = confirmations.data?.filter((c) => c.isConfirm).length ?? 0;
  const disputed = confirmations.data?.filter((c) => !c.isConfirm).length ?? 0;

  return (
    <Dialog
      open={incidentId !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {incident.data
              ? incidentTypeLabel[incident.data.type]
              : "Détail de l'incident"}
          </DialogTitle>
          <DialogDescription>
            Informations du signalement et avis de la communauté.
          </DialogDescription>
        </DialogHeader>

        {incident.isPending ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : incident.isError || !incident.data ? (
          <p className="py-8 text-center text-sm text-destructive">
            Impossible de charger l&apos;incident.
          </p>
        ) : (
          <div className="space-y-5">
            <section>
              <h3 className="mb-1 text-sm font-semibold text-foreground">
                Incident
              </h3>
              <div className="divide-y divide-border">
                <Row label="Type" value={incidentTypeLabel[incident.data.type]} />
                <Row label="Statut" value={incident.data.status} />
                <Row label="Adresse" value={incident.data.address ?? "—"} />
                <Row
                  label="Description"
                  value={incident.data.description ?? "—"}
                />
                <Row
                  label="Position"
                  value={`${Number(incident.data.latitude).toFixed(5)}, ${Number(
                    incident.data.longitude
                  ).toFixed(5)}`}
                />
                <Row
                  label="Confirmations"
                  value={incident.data.confirmationCount}
                />
                <Row
                  label="Déclaré le"
                  value={formatDateTime(incident.data.createdAt).date}
                />
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Avis de la communauté
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-traffic-fluide">
                    <ThumbsUp className="size-3.5" />
                    {confirmed}
                  </span>
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <ThumbsDown className="size-3.5" />
                    {disputed}
                  </span>
                </div>
              </div>

              {confirmations.isPending ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : !confirmations.data || confirmations.data.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  Aucune confirmation pour le moment.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {confirmations.data.map((c) => {
                    const { date, time } = formatDateTime(c.createdAt);
                    return (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2 text-foreground">
                          {c.isConfirm ? (
                            <ThumbsUp className="size-4 text-traffic-fluide" />
                          ) : (
                            <ThumbsDown className="size-4 text-destructive" />
                          )}
                          <span className="font-mono text-xs">
                            {c.userId.slice(0, 8)}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            c.isConfirm
                              ? "text-traffic-fluide"
                              : "text-destructive"
                          )}
                        >
                          {c.isConfirm ? "Confirmé" : "Contesté"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {date} {time}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
