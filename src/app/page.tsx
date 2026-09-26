import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { preferredLocale } from "@/lib/preferred-locale";

export default async function RootPage() {
  const header = (await headers()).get("accept-language");
  redirect(`/${preferredLocale(header)}`);
}
