import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PrivateMessage from '@/models/PrivateMessage';
import User from '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher-server';

export async function GET(request: Request) {
  try {
    console.log('🔍 [API] GET /api/chat/private');
    
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log('👤 [API] Пользователь:', payload.userId);
    
    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get('withUserId');
    
    await connectToDatabase();
    
    // Если запрошена переписка с конкретным пользователем
    if (withUserId) {
      console.log('📨 [API] Запрос переписки с:', withUserId);
      
      const messages = await PrivateMessage.find({
        $or: [
          { fromUserId: payload.userId, toUserId: withUserId },
          { fromUserId: withUserId, toUserId: payload.userId },
        ],
      })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();
      
      console.log('📨 [API] Найдено сообщений:', messages.length);
      
      // Отмечаем как прочитанные
      await PrivateMessage.updateMany(
        { fromUserId: withUserId, toUserId: payload.userId, read: false },
        { $set: { read: true, readAt: new Date() } }
      );
      
      return NextResponse.json({ messages });
    }
    
    // Получаем ВСЕ сообщения пользователя
    console.log('💬 [API] Поиск всех сообщений пользователя...');
    
    const allMessages = await PrivateMessage.find({
      $or: [
        { fromUserId: payload.userId },
        { toUserId: payload.userId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('💬 [API] Всего сообщений:', allMessages.length);
    
    if (allMessages.length === 0) {
      return NextResponse.json({ dialogs: [] });
    }
    
    // Группируем по собеседнику
    const dialogsMap = new Map();
    
    for (const msg of allMessages) {
      // Определяем ID собеседника
      const otherUserId = msg.fromUserId.toString() === payload.userId 
        ? msg.toUserId.toString() 
        : msg.fromUserId.toString();
      
      // Если этого диалога еще нет в мапе, добавляем
      if (!dialogsMap.has(otherUserId)) {
        // Получаем данные пользователя
        const otherUser = await User.findById(otherUserId).select('username avatar').lean();
        
        dialogsMap.set(otherUserId, {
          _id: otherUserId,
          username: otherUser?.username || 'Unknown',
          avatar: otherUser?.avatar,
          lastMessage: msg,
          unreadCount: msg.toUserId.toString() === payload.userId && !msg.read ? 1 : 0,
        });
      } else {
        // Обновляем unreadCount для существующего диалога
        const existing = dialogsMap.get(otherUserId);
        if (msg.toUserId.toString() === payload.userId && !msg.read) {
          existing.unreadCount++;
        }
        // lastMessage остается самым новым, т.к. мы сортировали по убыванию
      }
    }
    
    // Преобразуем Map в массив и сортируем по дате последнего сообщения
    const dialogs = Array.from(dialogsMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    
    console.log('💬 [API] Сформировано диалогов:', dialogs.length);
    if (dialogs.length > 0) {
      console.log('💬 [API] Первый диалог:', dialogs[0].username, 'сообщений:', dialogs[0].unreadCount);
    }
    
    return NextResponse.json({ dialogs });
  } catch (error) {
    console.error('❌ [API] Ошибка:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('📤 [API] POST /api/chat/private');
    
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { toUserId, content } = await request.json();
    console.log('📤 [API] От:', payload.userId, 'Кому:', toUserId);
    
    if (!toUserId || !content?.trim()) {
      return NextResponse.json({ error: 'toUserId and content required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Получаем данные отправителя и получателя
    const [fromUser, toUser] = await Promise.all([
      User.findById(payload.userId).select('username avatar'),
      User.findById(toUserId).select('username avatar')
    ]);
    
    if (!toUser) {
      console.log('❌ [API] Получатель не найден');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const message = await PrivateMessage.create({
      fromUserId: payload.userId,
      fromUsername: fromUser?.username || payload.username,
      fromAvatar: fromUser?.avatar,
      toUserId: toUserId,
      toUsername: toUser.username,
      toAvatar: toUser.avatar,
      content: content.trim(),
      read: false,
      createdAt: new Date(),
    });
    
    console.log('✅ [API] Сообщение создано:', message._id);
    
    // Отправляем через Pusher в реальном времени
    try {
      // Канал для отправителя и получателя
      const senderChannel = `private-chat-${payload.userId}-${toUserId}`;
      const receiverChannel = `private-chat-${toUserId}-${payload.userId}`;
      
      await pusherServer.trigger(senderChannel, 'new-message', message);
      await pusherServer.trigger(receiverChannel, 'new-message', message);
      
      console.log('📡 [API] Pusher уведомление отправлено');
    } catch (pusherError) {
      console.error('⚠️ [API] Ошибка Pusher:', pusherError);
      // Не блокируем отправку сообщения если Pusher не работает
    }
    
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('❌ [API] Ошибка:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - удалить сообщение
export async function DELETE(request: Request) {
  try {
    console.log('🗑️ [API] DELETE /api/chat/private');
    
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
    
    const message = await PrivateMessage.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Проверка прав: админ или автор сообщения
    const isAdmin = payload.email === 'admin@example.com';
    const isAuthor = message.fromUserId.toString() === payload.userId;
    
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await message.deleteOne();
    
    console.log('✅ [API] Сообщение удалено:', messageId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [API] Ошибка:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}