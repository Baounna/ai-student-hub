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

export function isGa4Enabled() {
  return getAnalyticsMode() === "ga4" && Boolean(getGa4MeasurementId());
}
