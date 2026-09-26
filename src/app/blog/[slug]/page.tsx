import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { preferredLocale } from "@/lib/preferred-locale";

// Was a hardcoded /en. See src/lib/preferred-locale.ts.
export default async function BlogPostRedirect(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const header = (await headers()).get("accept-language");
  redirect(`/${preferredLocale(header)}/blog/${params.slug}`);
}
