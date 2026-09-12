import { redirect } from "next/navigation";

export default async function CompareSlugRedirectPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  redirect(`/en/compare/${params.slug}`);
}
