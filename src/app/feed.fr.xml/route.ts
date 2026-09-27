import { feedResponse } from "@/lib/feed";

export async function GET() {
  return feedResponse("fr");
}
