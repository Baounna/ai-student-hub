import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * The ordinary config plus a shifted clock. Used only by `npm run test:clock`.
 */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
    setupFiles: ["./scripts/lib/fake-clock.ts"]
  }
});
