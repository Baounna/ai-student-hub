"use client";

import { useEffect } from "react";
import { applyStoredAppearance } from "@/lib/appearance";

/**
 * Renders nothing. It exists so applyStoredAppearance runs on responses where
 * the layout's beforeInteractive script does not -- see that function for which
 * ones and why.
 */
export function AppearanceSync() {
  useEffect(() => {
    applyStoredAppearance();
  }, []);

  return null;
}
