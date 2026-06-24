import { notFound, redirect } from "next/navigation";

function isInternalGrowthSprintEnabled() {
  const flag = (process.env.ENABLE_INTERNAL_GROWTH_SPRINT || "").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export default function GrowthSprintRedirectPage() {
  if (!isInternalGrowthSprintEnabled()) notFound();
  redirect("/en/growth-sprint");
}
