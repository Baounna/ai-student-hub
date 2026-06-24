type BotProtectionMode = "none" | "turnstile";

type BotVerificationResult = {
  ok: boolean;
  reason: "disabled" | "verified" | "missing_token" | "provider_unavailable" | "invalid_token";
};

function normalizeMode(value: string | undefined): BotProtectionMode {
  return (value || "").trim().toLowerCase() === "turnstile" ? "turnstile" : "none";
}

function getBotMode(): BotProtectionMode {
  return normalizeMode(process.env.BOT_PROTECTION_MODE);
}

function getTurnstileSecret() {
  return (process.env.TURNSTILE_SECRET_KEY || "").trim();
}

export function getClientBotProtectionMode() {
  return normalizeMode(process.env.NEXT_PUBLIC_BOT_PROTECTION_MODE);
}

export function getTurnstileSiteKey() {
  return (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();
}

export function isBotProtectionEnabled() {
  const mode = getBotMode();
  if (mode === "none") return false;
  if (mode === "turnstile") return Boolean(getTurnstileSecret());
  return false;
}

export async function verifyBotChallenge(
  rawToken: string | undefined,
  remoteIp: string
): Promise<BotVerificationResult> {
  const mode = getBotMode();
  if (mode === "none") return { ok: true, reason: "disabled" };

  if (mode !== "turnstile") return { ok: true, reason: "disabled" };

  const secret = getTurnstileSecret();
  if (!secret) return { ok: false, reason: "provider_unavailable" };

  const token = String(rawToken || "").trim();
  if (!token) return { ok: false, reason: "missing_token" };

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(5_000)
    });
    if (!response.ok) return { ok: false, reason: "provider_unavailable" };

    const payload = (await response.json()) as { success?: boolean };
    if (payload.success) return { ok: true, reason: "verified" };
    return { ok: false, reason: "invalid_token" };
  } catch {
    return { ok: false, reason: "provider_unavailable" };
  }
}

