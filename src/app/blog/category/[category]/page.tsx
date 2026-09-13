import { redirect } from "next/navigation";

export default async function CategoryRedirect(props: { params: Promise<{ category: string }> }) {
  const params = await props.params;
  redirect(`/en/blog/category/${params.category}`);
}
