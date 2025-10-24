import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const publicRoutes = ['/', '/register', '/path:*.svg'];

const middleware = async (request: NextRequest) => {
    const cookieStore = await cookies();
    const credentials = cookieStore.get("credentials")?.value;
    const pathname = request.nextUrl.pathname;
    const isAuthenticated = !!credentials;
    const isPublic = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`) || pathname.endsWith('.svg'));

    if (!isAuthenticated && !isPublic) {
        return NextResponse.redirect(new URL("/", request.url));
    }
    else if (isAuthenticated && isPublic) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next|api|.*\\..*).*)'],
};

export { middleware };
