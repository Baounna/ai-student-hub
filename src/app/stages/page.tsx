import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { preferredLocale } from "@/lib/preferred-locale";

// /stages had no stub and so was a 404, while /about, /blog, /compare, /donate,
// /resources and /growth-sprint all had one. This is the URL a reader types, or
// pastes into a message, for the part of the site most worth linking to -- and
// it answered with nothing. Locale comes from the request rather than a
// hardcoded /en, for the reason src/lib/preferred-locale.ts explains.
export default async function StagesRedirect() {
  const header = (await headers()).get("accept-language");
  redirect(`/${preferredLocale(header)}/stages`);
}
