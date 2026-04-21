import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Satpam ngecek: "Ada KTP (Cookie) isLoggedIn nggak nih orang?"
  const isLoggedIn = request.cookies.has('isLoggedIn');

  // Kalau NGGAK ADA KTP, langsung seret balik ke halaman Login!
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  //  Kalau ADA KTP, silakan lewat, Bos!
  return NextResponse.next();
}

// Daftar rute/ruangan yang dijaga ketat sama satpam ini:
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/data-sources/:path*',
    '/infrastructure/:path*',
    '/team/:path*',
    '/security/:path*',
    '/settings/:path*'
  ],
};