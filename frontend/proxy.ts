import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const isLoggedIn = request.cookies.has('isLoggedIn');
  const path = request.nextUrl.pathname;

  // Kalau sudah login tapi mengakses halaman auth, redirect ke dashboard
  if (isLoggedIn && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Kalau belum login tapi mencoba akses halaman yang dilindungi, redirect ke login
  if (!isLoggedIn && path !== '/login' && path !== '/register') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Daftar route yang dilindungi oleh middleware auth
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/custom-dashboard/:path*', 
    '/data-sources/:path*',
    '/infrastructure/:path*',
    '/team/:path*',
    '/security/:path*',
    '/settings/:path*',
    '/queries/:path*',
    '/ai-chat/:path*',
    '/login',    
    '/register'
  ],
};