"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@fikiri/ui/components/sonner";
import { ThemeProvider } from "@fikiri/ui/components/theme-provider";

import { getQueryClient } from "./_lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const showDevtools = process.env.NODE_ENV === "development";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
        {showDevtools ? (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-right"
          />
        ) : null}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
