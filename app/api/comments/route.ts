import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import Notification from '@/models/Notification';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// GET - получить комментарии поста
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    
    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const comments = await Comment.find({ postId, parentId: null })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .lean();
    
    // Получаем все ID комментариев для поиска ответов
    const commentIds = comments.map(c => c._id);
    const replies = await Comment.find({ parentId: { $in: commentIds } })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 })
      .lean();
    
    // Группируем ответы по parentId
    const repliesMap: Record<string, any[]> = {};
    replies.forEach(reply => {
      const parentId = reply.parentId.toString();
      if (!repliesMap[parentId]) {
        repliesMap[parentId] = [];
      }
      repliesMap[parentId].push(reply);
    });
    
    const commentsWithReplies = comments.map(comment => ({
      ...comment,
      replies: repliesMap[comment._id.toString()] || []
    }));
    
    return NextResponse.json({ comments: commentsWithReplies });
  } catch (error) {
    console.error('GET comments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - создать комментарий
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { postId, content, parentId } = await request.json();
    
    if (!postId || !content) {
      return NextResponse.json({ error: 'postId and content required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Получаем пост для уведомления
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    const comment = await Comment.create({
      postId,
      author: payload.userId,
      authorName: payload.username,
      content,
      parentId: parentId || null,
    });
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar');
    
    // Уведомление автору поста (если комментатор не автор)
    if (post.author.toString() !== payload.userId) {
      await Notification.create({
        userId: post.author.toString(),
        type: 'comment',
        sourceId: post.slug,
        sourceSlug: post.slug,
        sourceAuthorId: payload.userId,
        sourceTitle: post.title,
      });
      console.log('📬 Уведомление создано для автора поста');
    }
    
    // Если это ответ на комментарий — уведомляем автора родительского комментария
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (parentComment && parentComment.author.toString() !== payload.userId) {
        await Notification.create({
          userId: parentComment.author.toString(),
          type: 'reply',
          sourceId: post.slug,
          sourceSlug: post.slug,
          sourceAuthorId: payload.userId,
          sourceTitle: post.title,
        });
        console.log('📬 Уведомление создано для автора комментария');
      }
    }
    
    return NextResponse.json(populatedComment, { status: 201 });
  } catch (error) {
    console.error('POST comment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}