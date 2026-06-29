"use client";

import {
  LayoutDashboard,
  Map,
  Navigation,
  TriangleAlert,
  Gauge,
  Users,
  BarChart3,
  Settings,
  Car,
  LogOut,
  type LucideIcon,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@fikiri/ui/lib/utils";

import { useAuth } from "../_lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Pastille de comptage optionnelle (ex. signalements en attente). */
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Tableau de bord", href: "/", icon: LayoutDashboard },
      { label: "Carte en temps réel", href: "/carte", icon: Map },
      { label: "Courses", href: "/courses", icon: Navigation },
    ],
  },
  {
    title: "Trafic",
    items: [
      { label: "Rapports de trafic", href: "/rapports", icon: TriangleAlert },
      { label: "Signalements", href: "/signalements", icon: Gauge },
      { label: "Analytiques", href: "/analytiques", icon: BarChart3 },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Utilisateurs", href: "/utilisateurs", icon: Users },
      { label: "Paramètres", href: "/parametres", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Car className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-base font-semibold">Fikiri Traffic</p>
          <p className="text-xs text-sidebar-foreground/60">Admin Dashboard</p>
        </div>
      </div>

      {/* Navigation groupée */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {section.title}
            </p>
            {section.items.map(({ label, href, icon: Icon, badge }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="truncate">{label}</span>
                  {badge ? (
                    <span
                      className={cn(
                        "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                        isActive
                          ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                          : "bg-sidebar-accent text-sidebar-foreground"
                      )}
                    >
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Profil + déconnexion */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            {initial}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs capitalize text-sidebar-foreground/60">
              {user?.role ?? "Administrateur"}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Se déconnecter"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
