import { useState, useEffect, useRef, useCallback, type RefObject } from "react";

/**
 * Returns true once SmartClient (window.isc.Canvas) is available.
 * Polls briefly on mount in case scripts are still loading.
 */
export function useSmartClientReady(): boolean {
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && !!window.isc?.Canvas
  );

  useEffect(() => {
    if (ready) return;
    const interval = setInterval(() => {
      if (window.isc?.Canvas) {
        setReady(true);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [ready]);

  return ready;
}

/**
 * Core hook for mounting a SmartClient widget inside a React-managed <div>.
 *
 * @param containerRef  React ref to the host <div> element
 * @param factory       Called with the host element; should return a created (but not drawn) widget
 * @param deps          Dependency array — widget is recreated when these change
 * @returns             Ref to the current widget instance (for imperative calls like setData)
 */
export function useSmartClientWidget<T extends isc.Canvas>(
  containerRef: RefObject<HTMLDivElement | null>,
  factory: ((el: HTMLElement) => T) | null,
  deps: unknown[] = []
): React.MutableRefObject<T | null> {
  const widgetRef = useRef<T | null>(null);

  // Stable reference to factory to avoid re-running effect on every render
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  const cleanup = useCallback(() => {
    if (widgetRef.current) {
      try {
        widgetRef.current.markForDestroy();
      } catch {
        // Widget may already be destroyed
      }
      widgetRef.current = null;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    const fn = factoryRef.current;
    if (!el || !fn) return;

    cleanup();

    const widget = fn(el);
    widget.draw();
    widgetRef.current = widget;

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, cleanup, ...deps]);

  return widgetRef;
}
