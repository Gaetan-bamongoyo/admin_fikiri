/**
 * Page « Rapports » = incidents signalés. On réutilise la couche incidents et
 * on ajoute l'action de validation admin (`verify`).
 *
 * Correspondance statut UI ↔ `IncidentStatus` :
 *   en-attente → `active` (confirmationCount < seuil)
 *   vérifié    → `active` (confirmationCount ≥ seuil, via verify)
 *   résolu     → `resolved`
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api-client";
import { incidentKeys, type Incident } from "./incidents";

export {
  useIncidents as useReports,
  useIncident as useReport,
  useResolveIncident as useResolveReport,
  incidentsQueryOptions as reportsQueryOptions,
} from "./incidents";
export type {
  Incident,
  IncidentType,
  IncidentStatus,
  IncidentsQuery as ReportsQuery,
} from "./incidents";

export function useVerifyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.patch<Incident>(`/incidents/${id}/verify`),
    onSuccess: (incident) => {
      queryClient.setQueryData(incidentKeys.detail(incident.id), incident);
      void queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
  });
}
