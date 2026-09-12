import { redirect } from "next/navigation";

export default async function BlogPostRedirect(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  redirect(`/en/blog/${params.slug}`);
}
