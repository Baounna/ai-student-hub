import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { preferredLocale } from "@/lib/preferred-locale";

// Was a hardcoded /en, so a French reader following an old link landed in the
// wrong edition of a bilingual site. See src/lib/preferred-locale.ts.
export default async function AboutRedirect() {
  const header = (await headers()).get("accept-language");
  redirect(`/${preferredLocale(header)}/about`);
}
