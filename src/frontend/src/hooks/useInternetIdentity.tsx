import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Identity } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";

type LoginStatus = "idle" | "logging-in" | "logged-in" | "error";

interface InternetIdentityState {
  identity: Identity | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clear: () => Promise<void>;
  loginStatus: LoginStatus;
  isInitializing: boolean;
}

const InternetIdentityContext = createContext<InternetIdentityState | null>(null);

const II_CANISTER = import.meta.env.CANISTER_ID_INTERNET_IDENTITY || "rdmx6-jaaaa-aaaaa-aaadq-cai";
const II_URL =
  import.meta.env.DFX_NETWORK === "ic"
    ? "https://identity.ic0.app"
    : `http://${II_CANISTER}.localhost:4943`;

// Dev mode: bypass II popup entirely with a deterministic identity
const DEV_BYPASS = import.meta.env.DFX_NETWORK !== "ic" && !!import.meta.env.DEV_BYPASS_II;

function createDevIdentity(seed: number = 0): Ed25519KeyIdentity {
  const bytes = new Uint8Array(32);
  bytes[0] = seed;
  return Ed25519KeyIdentity.generate(bytes);
}

export function InternetIdentityProvider({ children }: { children: ReactNode }) {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loginStatus, setLoginStatus] = useState<LoginStatus>("idle");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (DEV_BYPASS) {
      const seedParam = new URLSearchParams(window.location.search).get("dev_seed");
      const seed = seedParam ? parseInt(seedParam, 10) : 0;
      const devId = createDevIdentity(seed);
      console.log(`[DEV] Auto-login (seed=${seed}), principal:`, devId.getPrincipal().toText());
      setIdentity(devId);
      setLoginStatus("logged-in");
      setIsInitializing(false);
      return;
    }

    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      if (await client.isAuthenticated()) {
        const id = client.getIdentity();
        setIdentity(id);
        setLoginStatus("logged-in");
      }
      setIsInitializing(false);
    });
  }, []);

  const login = useCallback(async () => {
    if (DEV_BYPASS) {
      const seedParam = new URLSearchParams(window.location.search).get("dev_seed");
      const seed = seedParam ? parseInt(seedParam, 10) : 0;
      setIdentity(createDevIdentity(seed));
      setLoginStatus("logged-in");
      return;
    }

    if (!authClient) return;
    if (await authClient.isAuthenticated()) {
      throw new Error("User is already authenticated");
    }
    setLoginStatus("logging-in");
    await new Promise<void>((resolve, reject) => {
      authClient.login({
        identityProvider: II_URL,
        onSuccess: () => {
          const id = authClient.getIdentity();
          setIdentity(id);
          setLoginStatus("logged-in");
          resolve();
        },
        onError: (err) => {
          setLoginStatus("error");
          reject(new Error(err));
        },
      });
    });
  }, [authClient]);

  const logout = useCallback(async () => {
    if (DEV_BYPASS) {
      setIdentity(null);
      setLoginStatus("idle");
      return;
    }
    if (!authClient) return;
    await authClient.logout();
    setIdentity(null);
    setLoginStatus("idle");
  }, [authClient]);

  const clear = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <InternetIdentityContext.Provider
      value={{ identity, login, logout, clear, loginStatus, isInitializing }}
    >
      {children}
    </InternetIdentityContext.Provider>
  );
}

export { InternetIdentityContext };

export function useInternetIdentity(): InternetIdentityState {
  const context = useContext(InternetIdentityContext);
  if (!context) {
    throw new Error("useInternetIdentity must be used within InternetIdentityProvider");
  }
  return context;
}
