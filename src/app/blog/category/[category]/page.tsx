import { redirect } from "next/navigation";

export default function CategoryRedirect({ params }: { params: { category: string } }) {
  redirect(`/en/blog/category/${params.category}`);
}
