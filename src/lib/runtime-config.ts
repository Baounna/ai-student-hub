type EmailProvider = "none" | "convertkit";
type AnalyticsMode = "none" | "ga4";

// The OAuth, credentials and email-auth switches that used to live here were
// removed with the account system they configured. They were not harmless dead
// code: they kept telling anyone reading the config to supply OAuth provider
// keys and a Supabase service-role key, which is a high-privilege secret, for
// routes that no longer exist. The safest secret is the one nobody was asked to
// create.

function normalize(value: string | undefined) {
  return (value || "").trim().toLowerCase();
}

export function getEmailProvider(): EmailProvider {
  const value = normalize(process.env.EMAIL_PROVIDER);
  return value === "convertkit" ? "convertkit" : "none";
}

export function getAnalyticsMode(): AnalyticsMode {
  const value = normalize(process.env.ANALYTICS_MODE);
  return value === "ga4" ? "ga4" : "none";
}

export function getGa4MeasurementId() {
  return (process.env.GA4_MEASUREMENT_ID || "").trim();
}

/**
 * A GA4 id looks like G-XXXXXXXXXX. Any non-empty string used to satisfy this,
 * so the placeholder shipped in .env.example — G-REPLACE1234 — was enough to
 * load 148 KB of gtag that could never report anywhere. A performance pass
 * measured it: 70 KB unused, 110 ms of bootup, in front of every render, for a
 * property that does not exist. Production has no analytics configured at all,
 * so this only ever burned a developer's local page loads, which is exactly the
 * kind of cost nobody goes looking for.
 */
export function isGa4Enabled() {
  const id = getGa4MeasurementId();
  if (getAnalyticsMode() !== "ga4") return false;
  if (!/^G-[A-Z0-9]{6,}$/i.test(id)) return false;
  return !/replace|placeholder|example|xxxx|1234567890/i.test(id);
}
