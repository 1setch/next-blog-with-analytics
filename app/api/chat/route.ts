import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Message from '@/models/Message';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

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
    
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}