import { redirect } from "next/navigation";

export default function CompareSlugRedirectPage({ params }: { params: { slug: string } }) {
  redirect(`/en/compare/${params.slug}`);
}
