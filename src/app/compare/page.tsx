import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { preferredLocale } from "@/lib/preferred-locale";

// Was a hardcoded /en, so a French reader following an old /compare link landed
// in the English edition of a bilingual site. The same bug was fixed in the
// other stubs; these two were missed.
export default async function CompareRedirectPage() {
  const header = (await headers()).get("accept-language");
  redirect(`/${preferredLocale(header)}/compare`);
}
