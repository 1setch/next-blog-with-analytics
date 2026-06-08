import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// GET - получить уведомления пользователя
export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const notifications = await Notification.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    const unreadCount = await Notification.countDocuments({ 
      userId: payload.userId, 
      read: false 
    });
    
    console.log(`📬 Уведомления для ${payload.userId}: ${notifications.length}, непрочитанных: ${unreadCount}`);
    
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('GET notifications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - отметить как прочитанные
export async function PUT(request: Request) {
  try {
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { notificationIds } = await request.json();
    
    await connectToDatabase();
    
    await Notification.updateMany(
      { _id: { $in: notificationIds }, userId: payload.userId },
      { read: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT notifications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - удалить уведомление
export async function DELETE(request: Request) {
  try {
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');
    
    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    // Проверяем что уведомление принадлежит пользователю
    if (notification.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await notification.deleteOne();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE notification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}