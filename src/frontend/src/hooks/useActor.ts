import { createContext, useContext, useState, useEffect, ReactNode, createElement } from "react";
import { Actor, HttpAgent } from "@dfinity/agent";
import { useInternetIdentity } from "./useInternetIdentity";

// @ts-ignore - declarations generated at deploy time
import { idlFactory } from "../declarations/backend";

const CANISTER_ID =
  import.meta.env.CANISTER_ID_BACKEND || import.meta.env.BACKEND_CANISTER_ID || "";

const HOST =
  import.meta.env.DFX_NETWORK === "ic"
    ? "https://icp-api.io"
    : "http://127.0.0.1:4943";

interface ActorContextValue {
  actor: any;
  isFetching: boolean;
}

const ActorContext = createContext<ActorContextValue>({
  actor: null,
  isFetching: true,
});

export function ActorProvider({ children }: { children: ReactNode }) {
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

      if (import.meta.env.DFX_NETWORK !== "ic") {
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

export function useActor(): ActorContextValue {
  return useContext(ActorContext);
}
