import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher-server';

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { socket_id, channel_name } = await request.json();
    
    // Авторизация для приватных каналов
    const authResponse = pusherServer.authorizeChannel(socket_id, channel_name, {
      user_id: payload.userId,
      user_info: {
        username: payload.username,
      },
    });
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}