import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Публичные API
  const publicApiPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/me',
    '/api/posts',
    '/api/search',
    '/api/comments',
    '/api/chat',
    '/api/notifications', // Добавляем уведомления в публичные
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
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};