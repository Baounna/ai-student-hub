import { randomBytes } from "node:crypto";
import { absoluteUrl } from "@/lib/site-url";
import { isOAuthEnabled } from "@/lib/runtime-config";

export const OAUTH_STATE_COOKIE = "ash_oauth_state";

export type OAuthProvider = "google" | "github" | "linkedin";
export type OAuthMode = "register" | "login";

export type OAuthProviderView = {
  id: OAuthProvider;
  label: string;
  configured: boolean;
};

type ProviderConfig = {
  label: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
};

type OAuthContext = {
  provider: OAuthProvider;
  locale: "en" | "fr";
  mode: OAuthMode;
  returnTo: string;
  state: string;
  origin: string;
};

type OAuthTokenPayload = {
  accessToken: string;
  idToken?: string;
};

export type OAuthUser = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

const providerConfigs: Record<OAuthProvider, ProviderConfig> = {
  google: {
    label: "Google",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "email", "profile"]
  },
  github: {
    label: "GitHub",
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["read:user", "user:email"]
  },
  linkedin: {
    label: "LinkedIn",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["openid", "profile", "email"]
  }
};

function isEnFr(value: string): value is "en" | "fr" {
  return value === "en" || value === "fr";
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value in providerConfigs;
}

export function parseOAuthMode(value: string | null): OAuthMode {
  return value === "register" ? "register" : "login";
}

export function parseOAuthLocale(value: string | null): "en" | "fr" {
  return isEnFr(value || "") ? (value as "en" | "fr") : "en";
}

export function sanitizeReturnTo(value: string | null, locale: "en" | "fr") {
  if (!value || !value.startsWith("/")) return `/${locale}/account`;
  if (value.startsWith("//")) return `/${locale}/account`;
  return value;
}

export function getOAuthProviderViews(): OAuthProviderView[] {
  if (!isOAuthEnabled()) return [];

  return (Object.keys(providerConfigs) as OAuthProvider[]).map((provider) => ({
    id: provider,
    label: providerConfigs[provider].label,
    configured: isProviderConfigured(provider)
  }));
}

export function getProviderLabel(provider: OAuthProvider) {
  return providerConfigs[provider].label;
}

export function createOAuthState() {
  return randomBytes(20).toString("hex");
}

export function encodeOAuthContext(context: OAuthContext) {
  return Buffer.from(JSON.stringify(context)).toString("base64url");
}

export function decodeOAuthContext(value: string | undefined): OAuthContext | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as OAuthContext;
    if (!parsed || !isOAuthProvider(parsed.provider) || !isEnFr(parsed.locale)) return null;
    if (!parsed.origin || !/^https?:\/\//.test(parsed.origin)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getProviderCredentials(provider: OAuthProvider) {
  const config = providerConfigs[provider];
  const clientId = process.env[config.clientIdEnv]?.trim();
  const clientSecret = process.env[config.clientSecretEnv]?.trim();
  return {
    clientId: clientId || "",
    clientSecret: clientSecret || ""
  };
}

export function isProviderConfigured(provider: OAuthProvider) {
  if (!isOAuthEnabled()) return false;
  const creds = getProviderCredentials(provider);
  return Boolean(creds.clientId && creds.clientSecret);
}

function getRedirectUri(provider: OAuthProvider, origin?: string) {
  if (origin && /^https?:\/\//.test(origin)) {
    return `${origin.replace(/\/+$/, "")}/api/auth/oauth/${provider}/callback`;
  }
  return absoluteUrl(`/api/auth/oauth/${provider}/callback`);
}

export function buildProviderAuthorizeUrl(provider: OAuthProvider, state: string, origin?: string) {
  const config = providerConfigs[provider];
  const creds = getProviderCredentials(provider);
  if (!creds.clientId || !creds.clientSecret) return null;

  const params = new URLSearchParams();
  params.set("client_id", creds.clientId);
  params.set("redirect_uri", getRedirectUri(provider, origin));
  params.set("response_type", "code");
  params.set("scope", config.scopes.join(" "));
  params.set("state", state);

  if (provider === "google") {
    params.set("prompt", "select_account");
    params.set("access_type", "offline");
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}

export async function exchangeOAuthCode(
  provider: OAuthProvider,
  code: string,
  origin?: string
): Promise<OAuthTokenPayload> {
  const config = providerConfigs[provider];
  const creds = getProviderCredentials(provider);
  if (!creds.clientId || !creds.clientSecret) {
    throw new Error("provider_not_configured");
  }

  const params = new URLSearchParams();
  params.set("client_id", creds.clientId);
  params.set("client_secret", creds.clientSecret);
  params.set("code", code);
  params.set("redirect_uri", getRedirectUri(provider, origin));
  params.set("grant_type", "authorization_code");

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers:
      provider === "github"
        ? {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
          }
        : {
            "Content-Type": "application/x-www-form-urlencoded"
          },
    body: params.toString(),
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new Error("token_exchange_failed");
  }

  const data = (await response.json()) as { access_token?: string; id_token?: string };
  const accessToken = data.access_token?.trim();

  if (!accessToken) {
    throw new Error("missing_access_token");
  }

  return {
    accessToken,
    idToken: data.id_token
  };
}

async function fetchGoogleUser(accessToken: string): Promise<OAuthUser> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) throw new Error("google_userinfo_failed");
  const data = (await response.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!data.sub || !data.email) throw new Error("google_userinfo_incomplete");

  return {
    provider: "google",
    providerUserId: data.sub,
    email: data.email,
    name: data.name || data.email,
    avatarUrl: data.picture
  };
}

async function fetchGithubUser(accessToken: string): Promise<OAuthUser> {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json"
    },
    signal: AbortSignal.timeout(15_000)
  });

  if (!userResponse.ok) throw new Error("github_userinfo_failed");

  const userData = (await userResponse.json()) as {
    id?: number;
    login?: string;
    name?: string;
    email?: string | null;
    avatar_url?: string;
  };

  let email = userData.email || "";
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json"
      },
      signal: AbortSignal.timeout(15_000)
    });

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as Array<{ email?: string; primary?: boolean; verified?: boolean }>;
      const picked = emails.find((item) => item.primary && item.verified) || emails.find((item) => item.verified);
      email = picked?.email || "";
    }
  }

  if (!userData.id || !email) throw new Error("github_userinfo_incomplete");

  return {
    provider: "github",
    providerUserId: String(userData.id),
    email,
    name: userData.name || userData.login || email,
    avatarUrl: userData.avatar_url
  };
}

async function fetchLinkedInUser(accessToken: string): Promise<OAuthUser> {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) throw new Error("linkedin_userinfo_failed");

  const data = (await response.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!data.sub || !data.email) throw new Error("linkedin_userinfo_incomplete");

  return {
    provider: "linkedin",
    providerUserId: data.sub,
    email: data.email,
    name: data.name || data.email,
    avatarUrl: data.picture
  };
}

export async function fetchOAuthUser(provider: OAuthProvider, accessToken: string): Promise<OAuthUser> {
  if (provider === "google") return fetchGoogleUser(accessToken);
  if (provider === "github") return fetchGithubUser(accessToken);
  return fetchLinkedInUser(accessToken);
}
