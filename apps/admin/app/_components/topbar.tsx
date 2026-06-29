"use client";

import { PanelLeft, Search, Bell, LogOut } from "lucide-react";

import { ModeToggle } from "@fikiri/ui/components/mode-toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@fikiri/ui/components/popover";
import { cn } from "@fikiri/ui/lib/utils";

import { useAuth } from "../_lib/auth";
import {
  useAlerts,
  useMarkAlertRead,
  type AlertSeverity,
} from "../_lib/queries/alerts";

const severityDot: Record<AlertSeverity, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

const relativeTime = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 60) return relativeTime.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return relativeTime.format(diffHour, "hour");
  return relativeTime.format(Math.round(diffHour / 24), "day");
}

export function Topbar() {
  const { user, logout } = useAuth();
  const alerts = useAlerts();
  const markRead = useMarkAlertRead();

  const items = alerts.data ?? [];
  const unreadCount = items.filter((alert) => !alert.isRead).length;

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
      <button
        type="button"
        aria-label="Basculer la barre latérale"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <PanelLeft className="size-5" />
      </button>

      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Rechercher..."
          className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <ModeToggle />

        <Popover>
          <PopoverTrigger
            aria-label="Notifications"
            className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Bell className="size-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </PopoverTrigger>

          <PopoverContent align="end" className="w-80 gap-0 p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                Notifications
              </p>
              {unreadCount > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {alerts.isPending ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Chargement…
                </p>
              ) : items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Aucune notification
                </p>
              ) : (
                items.map((alert) => (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() =>
                      alert.isRead ? undefined : markRead.mutate(alert.id)
                    }
                    className={cn(
                      "flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent",
                      alert.isRead ? "opacity-60" : "bg-accent/30"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        severityDot[alert.severity]
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-foreground">
                        {alert.message}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatRelative(alert.createdAt)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
            {initial}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[140px] truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
            <span className="block text-xs capitalize text-muted-foreground">
              {user?.role ?? "—"}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={logout}
          aria-label="Se déconnecter"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-5" />
        </button>
      </div>
    </header>
  );
}
