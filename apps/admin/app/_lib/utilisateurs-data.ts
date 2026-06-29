/** Données de gestion des utilisateurs (maquette statique). */

export type UserRole = "utilisateur" | "moderateur" | "admin";
export type UserStatus = "actif" | "suspendu" | "banni";

export interface UserRoleMeta {
  role: UserRole;
  label: string;
  badgeClass: string;
}

export const userRoles: Record<UserRole, UserRoleMeta> = {
  utilisateur: {
    role: "utilisateur",
    label: "Utilisateur",
    badgeClass: "bg-traffic-leger/15 text-traffic-leger",
  },
  moderateur: {
    role: "moderateur",
    label: "Modérateur",
    badgeClass: "bg-traffic-modere/15 text-traffic-modere",
  },
  admin: {
    role: "admin",
    label: "Admin",
    badgeClass: "bg-brand text-white",
  },
};

export interface UserStatusMeta {
  status: UserStatus;
  label: string;
  badgeClass: string;
}

export const userStatuses: Record<UserStatus, UserStatusMeta> = {
  actif: {
    status: "actif",
    label: "Actif",
    badgeClass: "bg-traffic-fluide/15 text-traffic-fluide",
  },
  suspendu: {
    status: "suspendu",
    label: "Suspendu",
    badgeClass: "bg-traffic-modere/15 text-traffic-modere",
  },
  banni: {
    status: "banni",
    label: "Banni",
    badgeClass: "bg-destructive/15 text-destructive",
  },
};

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  reports: number;
  joinedAt: string;
}

export const users: PlatformUser[] = [
  {
    id: "usr-1",
    name: "Jean Mukendi",
    email: "jean.mukendi@example.com",
    phone: "+243 812 345 678",
    role: "utilisateur",
    status: "actif",
    reports: 45,
    joinedAt: "15/01/2024",
  },
  {
    id: "usr-2",
    name: "Marie Kalala",
    email: "marie.kalala@example.com",
    phone: "+243 823 456 789",
    role: "moderateur",
    status: "actif",
    reports: 128,
    joinedAt: "20/11/2023",
  },
  {
    id: "usr-3",
    name: "Pierre Kabamba",
    email: "pierre.kabamba@example.com",
    phone: "+243 834 567 890",
    role: "utilisateur",
    status: "actif",
    reports: 23,
    joinedAt: "08/03/2024",
  },
  {
    id: "usr-4",
    name: "Sophie Mbuyi",
    email: "sophie.mbuyi@example.com",
    phone: "+243 845 678 901",
    role: "utilisateur",
    status: "suspendu",
    reports: 89,
    joinedAt: "12/09/2023",
  },
  {
    id: "usr-5",
    name: "André Tshimanga",
    email: "andre.tshimanga@example.com",
    phone: "+243 856 789 012",
    role: "admin",
    status: "actif",
    reports: 234,
    joinedAt: "01/06/2023",
  },
];

export interface UserSummary {
  key: string;
  label: string;
  value: string;
  /** Couleur du chiffre. */
  colorClass: string;
}

export const userSummary: UserSummary[] = [
  {
    key: "total",
    label: "Total Utilisateurs",
    value: "12,458",
    colorClass: "text-foreground",
  },
  {
    key: "actifs",
    label: "Actifs",
    value: "11,892",
    colorClass: "text-traffic-fluide",
  },
  {
    key: "suspendus",
    label: "Suspendus",
    value: "234",
    colorClass: "text-traffic-modere",
  },
  {
    key: "bannis",
    label: "Bannis",
    value: "332",
    colorClass: "text-destructive",
  },
];
