import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Like from '@/models/Like';
import Post from '@/models/Post';
import Notification from '@/models/Notification'; // ← ДОБАВИТЬ ЭТОТ ИМПОРТ
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    console.log('🔍 [LIKE] Пост slug:', slug);
    
    await connectToDatabase();
    
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const post = await Post.findOne({ slug });
    console.log('🔍 [LIKE] Найден пост:', post?._id, post?.title);
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    const existingLike = await Like.findOne({
      postId: post._id,
      userId: payload.userId
    });
    
    if (existingLike) {
      // Удаляем лайк
      await existingLike.deleteOne();
      const newLikesCount = await Like.countDocuments({ postId: post._id });
      await Post.updateOne({ _id: post._id }, { likesCount: newLikesCount });
      
      console.log('❤️ [LIKE] Лайк удален, новый счетчик:', newLikesCount);
      
      return NextResponse.json({ 
        liked: false, 
        likesCount: newLikesCount 
      });
    } else {
      // Добавляем лайк
      await Like.create({ postId: post._id, userId: payload.userId });
      const newLikesCount = await Like.countDocuments({ postId: post._id });
      await Post.updateOne({ _id: post._id }, { likesCount: newLikesCount });
      
      console.log('❤️ [LIKE] Лайк добавлен, новый счетчик:', newLikesCount);
      
      // Создаем уведомление для автора поста (если лайк не от самого автора)
      if (post.author.toString() !== payload.userId) {
        await Notification.create({
          userId: post.author,
          type: 'like',
          sourceId: post._id,
          sourceAuthorId: payload.userId,
          sourceAuthorName: payload.username,
          sourceTitle: post.title,
        });
        console.log('🔔 [LIKE] Уведомление создано для:', post.author.toString());
      }
      
      return NextResponse.json({ 
        liked: true, 
        likesCount: newLikesCount 
      });
    }
  } catch (error) {
    console.error('❌ [LIKE] Ошибка:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectToDatabase();
    
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ liked: false, likesCount: 0 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ liked: false, likesCount: 0 });
    }
    
    const post = await Post.findOne({ slug });
    if (!post) {
      return NextResponse.json({ liked: false, likesCount: 0 });
    }
    
    const liked = await Like.exists({ postId: post._id, userId: payload.userId });
    
    return NextResponse.json({ 
      liked: !!liked, 
      likesCount: post.likesCount || 0 
    });
  } catch (error) {
    console.error('❌ [LIKE] GET ошибка:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}