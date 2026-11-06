import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { preferredLocale } from "@/lib/preferred-locale";

// /campus is the URL that goes on a poster and into a class WhatsApp group, so
// of every stub on this site it is the one most likely to be typed by hand
// rather than clicked. Locale comes from the request rather than a hardcoded
// /en, for the reason src/lib/preferred-locale.ts explains -- and it matters
// more here than elsewhere, because the readers this page is for are in Morocco
// and most of them will be asking for French.
export default async function CampusRedirect() {
  const header = (await headers()).get("accept-language");
  redirect(`/${preferredLocale(header)}/campus`);
}
