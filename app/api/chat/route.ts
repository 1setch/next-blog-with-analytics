import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Message from '@/models/Message';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher-server';

// GET - получить последние сообщения
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    await connectToDatabase();
    
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('GET messages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - отправить сообщение
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
    
    const { content } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }
    
    if (content.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500)' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const message = await Message.create({
      username: payload.username,
      userId: payload.userId,
      content: content.trim(),
      createdAt: new Date(),
    });
    
    // Отправляем через Pusher
    await pusherServer.trigger('chat-channel', 'new-message', message);
    
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - удалить сообщение (для админа или автора)
export async function DELETE(request: Request) {
  try {
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    
    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Проверка прав: админ или автор сообщения
    const isAdmin = payload.email === 'admin@example.com';
    const isAuthor = message.userId?.toString() === payload.userId;
    
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await message.deleteOne();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE message error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}