import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Like from '@/models/Like';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ liked: {} });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ liked: {} });
    }
    
    const { postIds } = await request.json();
    
    // Находим все лайки пользователя за один запрос
    const likes = await Like.find({
      postId: { $in: postIds },
      userId: payload.userId
    });
    
    const likedMap: Record<string, boolean> = {};
    likes.forEach(like => {
      likedMap[like.postId.toString()] = true;
    });
    
    return NextResponse.json({ liked: likedMap });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}