export function getOAuthErrorMessage(error: string | null, locale: "en" | "fr") {
  if (!error) return null;

  const fr = locale === "fr";
  const map: Record<string, string> = {
    provider_not_configured: fr
      ? "Connexion sociale temporairement indisponible. Utilise la connexion email."
      : "Social sign-in is temporarily unavailable. Use email login instead.",
    oauth_disabled: fr
      ? "Connexion sociale desactivee. Utilise la connexion email."
      : "Social sign-in is disabled. Use email login.",
    missing_context: fr
      ? "Session OAuth expiree. Reessaie la connexion."
      : "OAuth session expired. Please try again.",
    provider_mismatch: fr
      ? "Erreur provider OAuth. Reessaie."
      : "OAuth provider mismatch. Please retry.",
    context_encode_failed: fr
      ? "Erreur de session OAuth. Reessaie."
      : "OAuth session encoding failed. Please retry.",
    state_mismatch: fr
      ? "Verification de securite echouee. Reessaie."
      : "Security verification failed. Please retry.",
    missing_code: fr ? "Code OAuth manquant." : "OAuth code is missing.",
    token_exchange_failed: fr
      ? "Echange OAuth echoue. Reessaie."
      : "OAuth token exchange failed. Please retry.",
    missing_access_token: fr
      ? "Token d'acces manquant."
      : "Access token is missing.",
    google_userinfo_failed: fr
      ? "Impossible de recuperer ton profil Google."
      : "Unable to read your Google profile.",
    github_userinfo_failed: fr
      ? "Impossible de recuperer ton profil GitHub."
      : "Unable to read your GitHub profile.",
    linkedin_userinfo_failed: fr
      ? "Impossible de recuperer ton profil LinkedIn."
      : "Unable to read your LinkedIn profile."
  };

  return map[error] || (fr ? "Connexion OAuth echouee. Reessaie." : "OAuth sign-in failed. Please retry.");
}
