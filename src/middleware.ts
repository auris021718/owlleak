import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Skip authentication for auth APIs, login page, static files, and public assets
  if (
    path.startsWith('/api/auth') ||
    path === '/login' ||
    path.startsWith('/_next') ||
    path === '/favicon.ico' ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.svg') ||
    path.endsWith('.webp')
  ) {
    return NextResponse.next();
  }

  // 2. Extract token from Cookie or Authorization header
  let token = request.cookies.get('admin_session')?.value;
  
  const authHeader = request.headers.get('Authorization');
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 3. For public pages (home `/`, estimate `/estimate`, ai diagnosis `/ai-diagnosis`, etc.)
  const isProtectedAdminRoute = path.startsWith('/admin');
  const isProtectedUserDashboard = path.startsWith('/dashboard');

  if (!isProtectedAdminRoute && !isProtectedUserDashboard) {
    return NextResponse.next();
  }

  // 4. If token is missing for protected routes
  if (!token) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Verify token and check role
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const { payload } = await jwtVerify(token, secret);
    const userRole = (payload.role as string) || 'partner';

    // If attempting to access /admin but role is NOT admin, redirect to User Dashboard /dashboard
    if (isProtectedAdminRoute && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware JWT verification failed:', error);
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
