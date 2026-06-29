import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";

import { ApiError } from "./api-client";

/**
 * Crée un `QueryClient` avec des réglages adaptés à l'App Router Next.js.
 *
 * Un `staleTime` non nul évite un re-fetch immédiat côté client après une
 * hydratation rendue sur le serveur.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 min — données considérées fraîches
        gcTime: 5 * 60 * 1000, // 5 min en cache après inactivité
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // On ne réessaie pas les erreurs client (4xx).
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      dehydrate: {
        // Inclut aussi les requêtes en cours (pending) dans le streaming SSR.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Renvoie le `QueryClient` à utiliser :
 * - côté serveur : un nouveau client à chaque requête (pas de partage entre users) ;
 * - côté navigateur : un singleton, pour ne pas le recréer à chaque rendu.
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
