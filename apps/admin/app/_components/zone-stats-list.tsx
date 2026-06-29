export interface ZoneStat {
  rank: number;
  name: string;
  reports: number;
  perDay: number;
}

export function ZoneStatsList({ data }: { data: ZoneStat[] }) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Aucune zone à afficher pour le moment.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((zone) => (
        <li
          key={zone.rank}
          className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"
        >
          <div className="flex items-center gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
              #{zone.rank}
            </span>
            <div>
              <p className="font-medium text-foreground">{zone.name}</p>
              <p className="text-sm text-muted-foreground">
                {zone.reports} rapports ce mois
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Moyenne</p>
              <p className="font-semibold text-foreground">
                {zone.perDay} / jour
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Détails
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
