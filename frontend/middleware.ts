import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.has('isLoggedIn');
  const path = request.nextUrl.pathname;

  // 1. Kalau ADA KTP, tapi iseng nongkrong di depan pintu (Login/Register)
  if (isLoggedIn && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Kalau NGGAK ADA KTP, tapi maksa masuk ke rute dalam
  if (!isLoggedIn && path !== '/login' && path !== '/register') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Kalau aman, silakan lewat, Bos!
  return NextResponse.next();
}

// Daftar ruangan yang dijaga ketat sama satpam middleware:
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/custom-dashboard/:path*', 
    '/data-sources/:path*',
    '/infrastructure/:path*',
    '/team/:path*',
    '/security/:path*',
    '/settings/:path*',
    '/login',    
    '/register'
  ],
};