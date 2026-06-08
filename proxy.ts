// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Публичные API (не требуют авторизации)
  const publicApiPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/me',
    '/api/posts',
    '/api/search',
    '/api/comments',
    '/api/chat',
    '/api/pusher/auth',
  ];
  
  if (publicApiPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Защищённые API
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Добавляем userId в заголовок (опционально)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};