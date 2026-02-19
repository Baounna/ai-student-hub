type OAuthMode = "enable" | "disable";
type EmailProvider = "none" | "convertkit";
type AnalyticsMode = "none" | "ga4";

function normalize(value: string | undefined) {
  return (value || "").trim().toLowerCase();
}

export function getOAuthMode(): OAuthMode {
  const value = normalize(process.env.OAUTH_MODE);
  return value === "disable" ? "disable" : "enable";
}

export function isOAuthEnabled() {
  return getOAuthMode() === "enable";
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
