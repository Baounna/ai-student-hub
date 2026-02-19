import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE, parseSessionToken } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const session = parseSessionToken(token);

  return NextResponse.json(
    {
      ok: true,
      authenticated: Boolean(session),
      user: session
        ? {
            name: session.name,
            email: session.email,
            provider: session.provider,
            avatarUrl: session.avatarUrl
          }
        : null
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    }
  );
}
