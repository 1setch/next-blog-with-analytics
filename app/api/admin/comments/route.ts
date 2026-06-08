import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload || payload.email !== 'admin@example.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const comments = await Comment.find()
      .populate('author', 'username avatar')
      .populate('postId', 'title slug')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    // Форматируем данные для фронтенда
    const formattedComments = comments.map(comment => ({
      ...comment,
      postId: comment.postId || { _id: null, title: 'Пост удален', slug: '#' }
    }));
    
    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}