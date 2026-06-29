import type { LucideIcon } from "lucide-react";

import { Card } from "@fikiri/ui/components/card";
import { cn } from "@fikiri/ui/lib/utils";

export interface ReportSummary {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
  /** Couleur du chiffre + icône. */
  colorClass: string;
}

export function ReportSummaryCard({ summary }: { summary: ReportSummary }) {
  const { label, value, icon: Icon, colorClass } = summary;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className={cn("text-3xl font-bold tracking-tight", colorClass)}>
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <Icon className={cn("size-7 shrink-0", colorClass)} />
      </div>
    </Card>
  );
}
