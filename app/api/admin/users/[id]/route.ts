import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import Like from '@/models/Like';
import Message from '@/models/Message';
import PrivateMessage from '@/models/PrivateMessage';
import Notification from '@/models/Notification';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectToDatabase();
    
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload || payload.email !== 'admin@example.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Нельзя удалить самого админа
    if (id === payload.userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }
    
    // Проверяем существование пользователя
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Удаляем все связанные данные
    await Post.deleteMany({ author: id });
    await Comment.deleteMany({ author: id });
    await Like.deleteMany({ userId: id });
    await Message.deleteMany({ userId: id });
    await PrivateMessage.deleteMany({ $or: [{ fromUserId: id }, { toUserId: id }] });
    await Notification.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);
    
    console.log(`✅ Пользователь ${user.username} (${id}) удален вместе со всеми данными`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}