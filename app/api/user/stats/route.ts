import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';
import Like from '@/models/Like';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const userId = payload.userId;
    
    // Посты автора
    const posts = await Post.find({ author: userId });
    const totalPosts = posts.length;
    const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
    
    // Топ постов автора
    const topPosts = await Post.find({ author: userId })
      .sort({ views: -1 })
      .limit(5)
      .select('title views slug');
    
    return NextResponse.json({
      totalPosts,
      totalViews,
      totalLikes,
      avgViewsPerPost: totalPosts ? Math.round(totalViews / totalPosts) : 0,
      topPosts
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}