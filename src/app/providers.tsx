"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 3, refetchOnWindowFocus: true },
          mutations: { retry: 5, retryDelay: (i) => Math.min(1000 * 2 ** i, 30_000) },
        },
      })
  );
  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}
