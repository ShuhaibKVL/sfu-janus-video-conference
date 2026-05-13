import { NextResponse, NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/"];

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;

    console.log("Middleware token:", token);

    const pathname =
        request.nextUrl.pathname;

    console.log("Middleware pathname:", pathname);

    /**
     * User already logged in
     * Prevent login/signup access
     */
    if (
        token &&
        PUBLIC_PATHS.includes(pathname)
    ) {

        return NextResponse.redirect(
            new URL("/meet", request.url)
        );
    }
    /**
       * User not logged in
       * Protect private routes
       */
    if (
        !token &&
        !PUBLIC_PATHS.includes(pathname)
    ) {

        return NextResponse.redirect(
            new URL("/login", request.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/meet",
        "/login",
        "/signup",
        "/room/:path*"
    ],
};