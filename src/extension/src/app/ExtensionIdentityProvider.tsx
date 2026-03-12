import { useState, useCallback, useEffect, ReactNode } from "react";
import { Identity } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { InternetIdentityContext } from "@/hooks/useInternetIdentity";

type LoginStatus = "idle" | "logging-in" | "logged-in" | "error";

// Same env vars baked in by vite.config.ts from root .env
const DEV_BYPASS = !!import.meta.env.DEV_BYPASS_II;
const DFX_NETWORK = import.meta.env.DFX_NETWORK || "";

function createDevIdentity(seed: number = 0): Ed25519KeyIdentity {
  const bytes = new Uint8Array(32);
  bytes[0] = seed;
  return Ed25519KeyIdentity.generate(bytes);
}

/**
 * Extension-specific identity provider.
 *
 * DEV mode: uses same Ed25519 seed-based bypass as frontend.
 * PROD mode: opens Internet Identity in a new tab, receives delegation
 * via chrome.runtime.sendMessage from callback.html.
 */
export function ExtensionIdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loginStatus, setLoginStatus] = useState<LoginStatus>("idle");
  const [isInitializing, setIsInitializing] = useState(true);

  // Listen for delegation messages from callback.html (production II flow)
  useEffect(() => {
    if (DEV_BYPASS) {
      // Auto-login with seed 0 in dev mode
      const devId = createDevIdentity(0);
      console.log("[EXT DEV] Auto-login, principal:", devId.getPrincipal().toText());
      setIdentity(devId);
      setLoginStatus("logged-in");
      setIsInitializing(false);
      return;
    }

    // Try to restore session from chrome.storage.session
    if (typeof chrome !== "undefined" && chrome.storage?.session) {
      chrome.storage.session.get("identity_key", (result) => {
        if (result.identity_key) {
          try {
            const restored = Ed25519KeyIdentity.fromJSON(result.identity_key);
            setIdentity(restored);
            setLoginStatus("logged-in");
          } catch (e) {
            console.warn("[EXT] Failed to restore identity:", e);
          }
        }
        setIsInitializing(false);
      });
    } else {
      setIsInitializing(false);
    }

    // Listen for delegation from callback.html
    const listener = (
      message: any,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: any) => void
    ) => {
      if (message.type === "II_DELEGATION") {
        try {
          const delegationIdentity = Ed25519KeyIdentity.fromJSON(message.identityKey);
          setIdentity(delegationIdentity);
          setLoginStatus("logged-in");
          // Persist to session storage
          if (chrome.storage?.session) {
            chrome.storage.session.set({ identity_key: message.identityKey });
          }
        } catch (e) {
          console.error("[EXT] Failed to process delegation:", e);
          setLoginStatus("error");
        }
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, []);

  const login = useCallback(async () => {
    if (DEV_BYPASS) {
      const devId = createDevIdentity(0);
      setIdentity(devId);
      setLoginStatus("logged-in");
      return;
    }

    // Production: open Internet Identity in a new tab
    setLoginStatus("logging-in");
    const iiUrl = DFX_NETWORK === "ic"
      ? "https://identity.ic0.app"
      : `http://${import.meta.env.CANISTER_ID_INTERNET_IDENTITY || "rdmx6-jaaaa-aaaaa-aaadq-cai"}.localhost:4943`;

    const callbackUrl = chrome.runtime.getURL("callback.html");
    const authUrl = `${iiUrl}#authorize=${encodeURIComponent(callbackUrl)}`;

    chrome.tabs.create({ url: authUrl });
  }, []);

  const logout = useCallback(async () => {
    setIdentity(null);
    setLoginStatus("idle");
    if (typeof chrome !== "undefined" && chrome.storage?.session) {
      chrome.storage.session.remove("identity_key");
    }
  }, []);

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
