import { jwtVerify } from "jose";
import { NextResponse, NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/"];

async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);

    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  console.log("Middleware token:", token);

  const pathname = request.nextUrl.pathname;

  console.log("Middleware pathname:", pathname);
  let isValidToken = false;

  // VERIFY TOKEN
  if (token) {
    const decoded = await verifyToken(token);

    if (decoded) {
      isValidToken = true;
    }
  }
  /**
   * User already logged in
   * Prevent login/signup access
   */
  if (isValidToken && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/meet", request.url));
  }
  /**
   * Unauthenticated users
   * Protect private routes
   */
  if (!isValidToken && !PUBLIC_PATHS.includes(pathname)) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    // REMOVE EXPIRED TOKEN
    response.cookies.delete("token");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/meet", "/login", "/signup", "/room/:path*"],
};
