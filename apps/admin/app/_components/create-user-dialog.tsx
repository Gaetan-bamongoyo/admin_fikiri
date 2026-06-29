"use client";

import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@fikiri/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@fikiri/ui/components/dialog";
import { Input } from "@fikiri/ui/components/input";
import { Label } from "@fikiri/ui/components/label";
import { toast } from "@fikiri/ui/components/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fikiri/ui/components/select";

import { ApiError } from "@/app/_lib/api-client";
import { useCreateUser, type ApiUserRole } from "@/app/_lib/queries/users";

const EMPTY_FORM = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  role: "user" as ApiUserRole,
};

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const createUser = useCreateUser();

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    try {
      await createUser.mutateAsync({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        role: form.role,
      });
      toast.success("Utilisateur créé avec succès");
      setForm(EMPTY_FORM);
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Erreur lors de la création de l'utilisateur";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand/90"
        >
          <UserPlus className="size-4" />
          Nouvel Utilisateur
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Renseignez les informations du compte. Un mot de passe d&apos;au
            moins 8 caractères est requis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cu-email">Email *</Label>
            <Input
              id="cu-email"
              type="email"
              required
              autoComplete="off"
              placeholder="utilisateur@fikiri.cd"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-password">Mot de passe *</Label>
            <Input
              id="cu-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Au moins 8 caractères"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cu-firstname">Prénom</Label>
              <Input
                id="cu-firstname"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-lastname">Nom</Label>
              <Input
                id="cu-lastname"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-phone">Téléphone</Label>
            <Input
              id="cu-phone"
              type="tel"
              placeholder="+243900000000"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Rôle</Label>
            <Select
              value={form.role}
              onValueChange={(value) => update("role", value as ApiUserRole)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Création…" : "Créer l'utilisateur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
