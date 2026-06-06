import { QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { createServices, type FountainLifeServices } from "./create-services";
import type { AuthSnapshot } from "./auth-service";

const ServicesContext = createContext<FountainLifeServices | null>(null);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const services = useMemo(() => createServices(), []);

  useEffect(() => {
    void services.auth.completeSignInFromRedirect();
  }, [services]);

  return (
    <ServicesContext.Provider value={services}>
      <QueryClientProvider client={services.queryClient}>{children}</QueryClientProvider>
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error("Fountain Life Notebook services are not available.");
  }

  return services;
}

export function useAuth(): AuthSnapshot {
  const { auth } = useServices();
  return useSyncExternalStore(
    (listener) => auth.subscribe(listener),
    () => auth.getSnapshot(),
    () => auth.getSnapshot(),
  );
}
