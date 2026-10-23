import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { preferredLocale } from "@/lib/preferred-locale";

// Same hardcoded /en as the index above it. A comparison URL is the kind of
// thing that gets shared, so this is the stub most likely to be followed by
// someone who did not choose the language.
export default async function CompareSlugRedirectPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const header = (await headers()).get("accept-language");
  redirect(`/${preferredLocale(header)}/compare/${params.slug}`);
}
