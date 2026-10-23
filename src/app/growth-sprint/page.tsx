import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { preferredLocale } from "@/lib/preferred-locale";

function isInternalGrowthSprintEnabled() {
  const flag = (process.env.ENABLE_INTERNAL_GROWTH_SPRINT || "").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export default async function GrowthSprintRedirectPage() {
  if (!isInternalGrowthSprintEnabled()) notFound();
  const header = (await headers()).get("accept-language");
  redirect(`/${preferredLocale(header)}/growth-sprint`);
}
