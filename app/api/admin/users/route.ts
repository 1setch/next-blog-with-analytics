import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post'; // ← ДОБАВЬ ЭТОТ ИМПОРТ!
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.email !== 'admin@example.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Для каждого пользователя считаем количество постов
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const postCount = await Post.countDocuments({ author: user._id });
        return {
          ...user.toObject(),
          postCount
        };
      })
    );
    
    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}