import { Fuel, Plus, SprayCan, Ticket, Wrench } from "lucide-react";

import { cn } from "@fikiri/ui/lib/utils";

import { expenses, type ExpenseKind } from "../_lib/fleet-data";

const expenseIcon: Record<ExpenseKind, typeof Fuel> = {
  carburant: Fuel,
  entretien: Wrench,
  lavage: SprayCan,
  peage: Ticket,
};

/** Grille « Toutes les dépenses » : cartes par catégorie. */
export function ExpensesGrid() {
  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Toutes les dépenses</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-medium text-traffic-fluide transition-opacity hover:opacity-80"
        >
          <Plus className="size-4" />
          Ajouter
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {expenses.map((expense) => {
          const Icon = expenseIcon[expense.id];
          return (
            <div
              key={expense.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  expense.bgClass,
                  expense.iconClass
                )}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{expense.label}</p>
                <p className="text-base font-bold text-foreground">${expense.amount}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
