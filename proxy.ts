import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Optimistic route protection. It only reads the signed session cookie
 * (no database access) to redirect early. It is NOT a security boundary:
 * every dashboard page and every API route re-checks authorization
 * close to the data (see lib/auth/dal.ts and lib/auth/guards.ts).
 *
 * The cookie name and JWT format must match lib/auth/session.ts. That file
 * is `server-only` and validates the whole environment on import, so it
 * is not reused here.
 */
const SESSION_COOKIE = "session";
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

async function readRole(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const role = await readRole(req);
  const isStaff = role === "ADMIN" || role === "STAFF";

  if (pathname.startsWith("/dashboard") && !isStaff) {
    // Signed-in customers have no business here; anonymous users log in.
    if (role) return NextResponse.redirect(new URL("/", req.url));

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isStaff) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
