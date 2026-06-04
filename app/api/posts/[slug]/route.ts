import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// GET - получить один пост
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    await connectToDatabase();
    
    const post = await Post.findOne({ slug })
      .populate('author', 'username avatar bio');
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Увеличиваем просмотры только для опубликованных постов
    if (post.status === 'published') {
      post.views += 1;
      await post.save();
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('GET post error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - обновление поста
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
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
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    if (post.author.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { title, content, description, tags, status } = await request.json();
    
    let newSlug = slug;
    if (title && title !== post.title) {
      newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existingPost = await Post.findOne({ slug: newSlug, _id: { $ne: post._id } });
      if (existingPost) {
        return NextResponse.json({ error: 'Post with this title already exists' }, { status: 400 });
      }
    }
    
    const updateData: any = {};
    if (title) updateData.title = title;
    if (newSlug !== slug) updateData.slug = newSlug;
    if (content) updateData.content = content;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags;
    if (status) {
      updateData.status = status;
      if (status === 'published' && post.status !== 'published') {
        updateData.publishedAt = new Date();
      }
    }
    
    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      updateData,
      { new: true }
    );
    
    // Подгружаем данные автора
    const postWithAuthor = await Post.findById(updatedPost._id)
      .populate('author', 'username avatar bio');
    
    return NextResponse.json(postWithAuthor);
  } catch (error) {
    console.error('PUT post error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - удаление поста
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
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
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    if (post.author.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await post.deleteOne();
    
    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('DELETE post error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}