import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Don't retry client errors (403/404 etc.); retry transient failures once.
      retry: (count, error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status && status < 500) return false;
        return count < 1;
      },
    },
  },
});

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster>{children}</Toaster>
    </TooltipProvider>
  </QueryClientProvider>
);
