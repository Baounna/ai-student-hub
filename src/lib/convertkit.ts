import { getEmailProvider } from "@/lib/runtime-config";

type SubscribeOptions = {
  email: string;
  firstName?: string;
  locale: string;
  source: string;
  extraTags?: string[];
};

function sanitizeTagFragment(value: string, fallback: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  return normalized || fallback;
}

export function normalizeLocale(value: string | undefined) {
  return value === "fr" ? "fr" : "en";
}

export function normalizeSource(value: string | undefined, fallback: string) {
  return sanitizeTagFragment(value || "", fallback);
}

function getConvertKitConfig() {
  return {
    formId: (process.env.CONVERTKIT_FORM_ID || "").trim(),
    apiKey: (process.env.CONVERTKIT_API_KEY || "").trim()
  };
}

export function isConvertKitConfigured() {
  const { formId, apiKey } = getConvertKitConfig();
  return Boolean(formId && apiKey);
}

export async function subscribeConvertKit(options: SubscribeOptions) {
  const isDev = process.env.NODE_ENV !== "production";

  if (getEmailProvider() !== "convertkit") {
    if (isDev) console.info("[convertkit] skipped: provider disabled");
    return { ok: true, skipped: true as const, reason: "provider_disabled" };
  }

  const { formId, apiKey } = getConvertKitConfig();
  if (!formId || !apiKey) {
    if (isDev) console.info("[convertkit] skipped: missing form id or api key");
    return { ok: true, skipped: true as const, reason: "provider_not_ready" };
  }

  const localeTag = normalizeLocale(options.locale);
  const sourceTag = normalizeSource(options.source, "site");
  const extraTags = (options.extraTags || []).map((tag) => sanitizeTagFragment(tag, "tag")).filter(Boolean);

  try {
    const response = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        api_key: apiKey,
        email: options.email,
        first_name: options.firstName || undefined,
        tags: ["ai-student-hub", `locale:${localeTag}`, `source:${sourceTag}`, ...extraTags]
      })
    });

    if (!response.ok) {
      if (isDev) console.info("[convertkit] provider error", response.status);
      return { ok: false, skipped: false as const, reason: "provider_error" };
    }
  } catch {
    if (isDev) console.info("[convertkit] provider request failed");
    return { ok: false, skipped: false as const, reason: "provider_error" };
  }

  return { ok: true, skipped: false as const, reason: "subscribed" };
}
