import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExtensionIdentityProvider } from "@ext/app/ExtensionIdentityProvider";
import { ExtensionActorProvider } from "@ext/app/ExtensionActorProvider";
import App from "@ext/app/App";
import "@ext/styles/index.css";

// Set mode before React mounts
(window as any).__EXTENSION_MODE = "sidepanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ExtensionIdentityProvider>
      <ExtensionActorProvider>
        <App />
      </ExtensionActorProvider>
    </ExtensionIdentityProvider>
  </QueryClientProvider>
);
