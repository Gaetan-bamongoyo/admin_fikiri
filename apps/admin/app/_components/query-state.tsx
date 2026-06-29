import { Loader2, TriangleAlert } from "lucide-react";

import { cn } from "@fikiri/ui/lib/utils";

/** Indicateur de chargement centré, à hauteur réglable. */
export function QueryLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-40 items-center justify-center text-muted-foreground",
        className
      )}
    >
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

/** Message d'erreur générique pour une requête échouée. */
export function QueryError({
  message = "Impossible de charger les données.",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground",
        className
      )}
    >
      <TriangleAlert className="size-6 text-destructive" />
      {message}
    </div>
  );
}
