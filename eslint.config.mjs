// Flat config: ESLint 9 no longer reads .eslintrc.json, and Next 16 removed
// `next lint`, so the lint script calls eslint directly.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"]
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Warn rather than error. The nine components this fires on all use the
      // standard SSR pattern of reading localStorage after mount and syncing it
      // into state, because that storage cannot be read while rendering on the
      // server. Reworking them (e.g. onto useSyncExternalStore) is a real
      // refactor of hydration-sensitive code and deserves its own change rather
      // than riding along with a dependency upgrade.
      "react-hooks/set-state-in-effect": "warn"
    }
  }
];

export default config;
