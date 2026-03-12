import { useState, useEffect, ReactNode, createElement } from "react";
import { Actor, HttpAgent } from "@dfinity/agent";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { ActorContext } from "@/hooks/useActor";

// @ts-ignore - declarations generated at deploy time
import { idlFactory } from "@/declarations/backend";

// Canister IDs baked in at build time by vite.config.ts
const CANISTER_ID =
  import.meta.env.CANISTER_ID_BACKEND || import.meta.env.BACKEND_CANISTER_ID || "";

const DFX_NETWORK = import.meta.env.DFX_NETWORK || "";

// Extension connects directly — no Vite proxy
const HOST = DFX_NETWORK === "ic"
  ? "https://icp-api.io"
  : "http://127.0.0.1:4943";

/**
 * Extension-specific actor provider.
 * Same logic as frontend ActorProvider but uses direct HTTP host
 * instead of relying on Vite's /api proxy.
 */
export function ExtensionActorProvider({ children }: { children: ReactNode }) {
  const { identity } = useInternetIdentity();
  const [actor, setActor] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!identity) {
      setActor(null);
      setIsFetching(false);
      return;
    }

    let cancelled = false;

    const setup = async () => {
      setIsFetching(true);
      const agent = await HttpAgent.create({ identity, host: HOST });

      if (DFX_NETWORK !== "ic") {
        await agent.fetchRootKey();
      }

      const backendActor = Actor.createActor(idlFactory, {
        agent,
        canisterId: CANISTER_ID,
      });

      if (!cancelled) {
        setActor(backendActor);
        setIsFetching(false);
      }
    };

    setup();
    return () => { cancelled = true; };
  }, [identity]);

  return createElement(ActorContext.Provider, { value: { actor, isFetching } }, children);
}
