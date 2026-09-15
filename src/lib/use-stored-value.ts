"use client";

import { useCallback, useSyncExternalStore } from "react";
import { APPEARANCE_CHANGE_EVENT } from "@/lib/appearance";

/**
 * Read a localStorage value during render instead of syncing it into state
 * from an effect.
 *
 * Nine components used the same pattern: read localStorage on mount, call
 * setState, render again. It works, but it is a cascading render on every
 * mount, and React's lint rule flags it for good reason. The value is external
 * state, so useSyncExternalStore is the tool for it — React renders the server
 * snapshot during hydration, then the real value, with no mismatch.
 *
 * Subscribing to `storage` is a genuine gain rather than lint housekeeping:
 * change the theme in one tab and the others follow, which the effect version
 * never did.
 *
 * @param key           localStorage key to read.
 * @param parse         Turns the raw string (or null) into the value you want.
 *                      Must return a primitive — useSyncExternalStore compares
 *                      snapshots by identity, so a fresh object each call would
 *                      loop forever.
 * @param serverValue   What the server renders, before any storage exists.
 */
export function useStoredValue<T extends string | number | boolean>(
  key: string,
  parse: (raw: string | null) => T,
  serverValue: T
): T {
  const subscribe = useCallback((onStoreChange: () => void) => {
    // `storage` covers other tabs; the appearance event covers this one, since
    // a same-tab write never fires `storage`.
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(APPEARANCE_CHANGE_EVENT, onStoreChange);
    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener(APPEARANCE_CHANGE_EVENT, onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    try {
      return parse(window.localStorage.getItem(key));
    } catch {
      // Storage can throw in private mode or when site data is blocked.
      return serverValue;
    }
  }, [key, parse, serverValue]);

  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * True once the client has taken over rendering.
 *
 * Several components render a placeholder until mounted, to avoid showing a
 * control whose state depends on storage the server cannot read.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
