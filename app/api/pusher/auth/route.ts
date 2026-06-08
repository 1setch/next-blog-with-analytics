import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher-server';

export async function POST(request: Request) {
  try {
    // Получаем данные из тела запроса (Pusher отправляет как form-urlencoded)
    const contentType = request.headers.get('content-type') || '';
    
    let socket_id = '';
    let channel_name = '';
    
    if (contentType.includes('application/json')) {
      // Если пришло JSON
      const body = await request.json();
      socket_id = body.socket_id;
      channel_name = body.channel_name;
    } else {
      // Если пришло form-urlencoded (стандарт Pusher)
      const text = await request.text();
      const params = new URLSearchParams(text);
      socket_id = params.get('socket_id') || '';
      channel_name = params.get('channel_name') || '';
    }
    
    console.log('🔐 Pusher auth request:', { socket_id, channel_name });
    
    if (!socket_id || !channel_name) {
      console.error('Missing socket_id or channel_name');
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }
    
    // Получаем токен из cookie
    const token = getTokenFromRequest(request as any);
    if (!token) {
      console.error('No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      console.error('Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log('🔐 Authorizing user:', payload.userId, 'for channel:', channel_name);
    
    // Авторизация для приватных каналов
    const authResponse = pusherServer.authorizeChannel(socket_id, channel_name, {
      user_id: payload.userId,
      user_info: {
        username: payload.username,
        email: payload.email,
      },
    });
    
    console.log('✅ Pusher auth successful');
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('❌ Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Auth failed', message: String(error) },
      { status: 500 }
    );
  }
}