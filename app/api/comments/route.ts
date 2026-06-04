import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment from '@/models/Comment';
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
    
    // Получаем ответы на комментарии
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentId: comment._id })
          .populate('author', 'username avatar')
          .sort({ createdAt: 1 })
          .lean();
        return { ...comment, replies };
      })
    );
    
    return NextResponse.json({ comments: commentsWithReplies });
  } catch (error) {
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
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { postId, content, parentId } = await request.json();
    
    if (!postId || !content) {
      return NextResponse.json({ error: 'postId and content required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const comment = await Comment.create({
      postId,
      author: payload.userId,
      authorName: payload.username,
      content,
      parentId: parentId || null,
    });
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar');
    
    return NextResponse.json(populatedComment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}