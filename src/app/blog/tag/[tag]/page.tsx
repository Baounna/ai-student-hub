import { redirect } from "next/navigation";

export default function TagRedirect({ params }: { params: { tag: string } }) {
  redirect(`/en/blog/tag/${params.tag}`);
}
