import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PrivateMessage from '@/models/PrivateMessage';
import User from '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// GET - получить диалоги или сообщения с конкретным пользователем
export async function GET(request: Request) {
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
    const withUserId = searchParams.get('withUserId');
    
    await connectToDatabase();
    
    // Если указан конкретный пользователь - получаем переписку с ним
    if (withUserId) {
      const messages = await PrivateMessage.find({
        $or: [
          { fromUserId: payload.userId, toUserId: withUserId },
          { fromUserId: withUserId, toUserId: payload.userId },
        ],
      })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();
      
      // Отмечаем сообщения как прочитанные
      await PrivateMessage.updateMany(
        { fromUserId: withUserId, toUserId: payload.userId, read: false },
        { read: true, readAt: new Date() }
      );
      
      return NextResponse.json({ messages });
    }
    
    // Иначе получаем список диалогов
    const dialogs = await PrivateMessage.aggregate([
      {
        $match: {
          $or: [
            { fromUserId: payload.userId },
            { toUserId: payload.userId },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$fromUserId', payload.userId] },
              '$toUserId',
              '$fromUserId',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$toUserId', payload.userId] }, { $eq: ['$read', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: 1,
          username: '$user.username',
          avatar: '$user.avatar',
          lastMessage: 1,
          unreadCount: 1,
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);
    
    return NextResponse.json({ dialogs });
  } catch (error) {
    console.error('GET private messages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - отправить личное сообщение
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
    
    const { toUserId, content } = await request.json();
    
    if (!toUserId || !content?.trim()) {
      return NextResponse.json({ error: 'toUserId and content required' }, { status: 400 });
    }
    
    if (content.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500)' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Получаем информацию о получателе
    const toUser = await User.findById(toUserId).select('username avatar');
    if (!toUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const message = await PrivateMessage.create({
      fromUserId: payload.userId,
      fromUsername: payload.username,
      toUserId: toUserId,
      toUsername: toUser.username,
      content: content.trim(),
      read: false,
      createdAt: new Date(),
    });
    
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('POST private message error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}