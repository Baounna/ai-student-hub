import { getAnalyticsMode, getEmailProvider, isCredentialsAuthEnabled } from "@/lib/runtime-config";
import { isValidEmail } from "@/lib/input";
import { parseHttpUrl } from "@/lib/url";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
let validated = false;

function isHttpsProductionOrigin(value: string) {
  const parsed = parseHttpUrl(value);
  if (!parsed) return false;
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return !LOCAL_HOSTS.has(host) && !host.endsWith(".local");
}

function hasStrongSecret(value: string) {
  return Boolean(value) && value.length >= 32 && value !== "change-this-in-production";
}

export function assertProductionRuntimeConfig() {
  if (validated) return;
  validated = true;

  if (process.env.NODE_ENV !== "production") return;

  const errors: string[] = [];
  const publicUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const siteUrl = (process.env.SITE_URL || "").trim();
  const secret = (process.env.AUTH_SESSION_SECRET || "").trim();
  const contactEmail = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "").trim();
  const legalName = (process.env.NEXT_PUBLIC_LEGAL_NAME || "").trim();
  const analyticsMode = getAnalyticsMode();
  const ga4Id = (process.env.GA4_MEASUREMENT_ID || "").trim();
  const emailProvider = getEmailProvider();
  const convertKitFormId = (process.env.CONVERTKIT_FORM_ID || "").trim();
  const convertKitApiKey = (process.env.CONVERTKIT_API_KEY || "").trim();
  const botMode = (process.env.BOT_PROTECTION_MODE || "").trim().toLowerCase();
  const publicBotMode = (process.env.NEXT_PUBLIC_BOT_PROTECTION_MODE || "").trim().toLowerCase();
  const turnstileSecret = (process.env.TURNSTILE_SECRET_KEY || "").trim();
  const turnstileSiteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();
  const authBackend = (process.env.AUTH_CREDENTIALS_BACKEND || "").trim().toLowerCase();
  const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
  const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!isHttpsProductionOrigin(publicUrl) || !isHttpsProductionOrigin(siteUrl)) {
    errors.push("SITE_URL and NEXT_PUBLIC_SITE_URL must be HTTPS, non-localhost origins.");
  }

  if (!hasStrongSecret(secret)) {
    errors.push("AUTH_SESSION_SECRET must be set to a strong 32+ character value.");
  }

  if (!isValidEmail(contactEmail)) {
    errors.push("NEXT_PUBLIC_CONTACT_EMAIL must be a valid email.");
  }

  if (!legalName) {
    errors.push("NEXT_PUBLIC_LEGAL_NAME must be set.");
  }

  if (analyticsMode === "ga4" && !ga4Id) {
    errors.push("GA4_MEASUREMENT_ID is required when ANALYTICS_MODE=ga4.");
  }

  if (emailProvider === "convertkit" && (!convertKitFormId || !convertKitApiKey)) {
    errors.push("CONVERTKIT_FORM_ID and CONVERTKIT_API_KEY are required when EMAIL_PROVIDER=convertkit.");
  }

  if (botMode === "turnstile") {
    if (!turnstileSecret) {
      errors.push("TURNSTILE_SECRET_KEY is required when BOT_PROTECTION_MODE=turnstile.");
    }
    if (!turnstileSiteKey) {
      errors.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY is required when BOT_PROTECTION_MODE=turnstile.");
    }
    if (publicBotMode !== "turnstile") {
      errors.push("NEXT_PUBLIC_BOT_PROTECTION_MODE must be set to turnstile when BOT_PROTECTION_MODE=turnstile.");
    }
  }

  if (isCredentialsAuthEnabled()) {
    if (authBackend === "supabase") {
      if (!isHttpsProductionOrigin(supabaseUrl)) {
        errors.push("SUPABASE_URL must be a valid HTTPS non-localhost URL when AUTH_CREDENTIALS_BACKEND=supabase.");
      }
      if (!supabaseServiceRoleKey) {
        errors.push("SUPABASE_SERVICE_ROLE_KEY is required when AUTH_CREDENTIALS_BACKEND=supabase.");
      }
    }
  }

  if (errors.length) {
    throw new Error(`Production configuration invalid: ${errors.join(" | ")}`);
  }
}
