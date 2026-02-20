type OAuthMode = "enable" | "disable";
type EmailProvider = "none" | "convertkit";
type AnalyticsMode = "none" | "ga4";
type EmailAuthMode = "oauth_only" | "insecure_demo";

function normalize(value: string | undefined) {
  return (value || "").trim().toLowerCase();
}

function normalizeBoolean(value: string | undefined) {
  const normalized = normalize(value);
  if (!normalized) return null;
  if (["1", "true", "yes", "on", "enable", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disable", "disabled"].includes(normalized)) return false;
  return null;
}

export function getOAuthMode(): OAuthMode {
  const toggle = normalizeBoolean(process.env.ENABLE_OAUTH);
  if (toggle !== null) return toggle ? "enable" : "disable";

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

export function getEmailAuthMode(): EmailAuthMode {
  const value = normalize(process.env.EMAIL_AUTH_MODE);
  return value === "insecure_demo" ? "insecure_demo" : "oauth_only";
}

export function isInsecureEmailAuthAllowed() {
  // Never allow insecure email-auth sessions in production unless explicitly enabled.
  if (process.env.NODE_ENV === "production") {
    return getEmailAuthMode() === "insecure_demo";
  }

  // Local development can keep fast iteration by default.
  if (!process.env.EMAIL_AUTH_MODE?.trim()) return true;
  return getEmailAuthMode() === "insecure_demo";
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
