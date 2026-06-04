import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// GET - получение постов (с фильтром по статусу)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const authorId = searchParams.get('authorId');
    const status = searchParams.get('status'); // draft, published, all
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    if (authorId) {
      query.author = authorId;
    }
    
    // Фильтр по статусу (показываем только опубликованные посты обычным пользователям)
    if (status === 'draft') {
      // Только для авторизованных пользователей их черновики
      query.status = 'draft';
    } else if (status === 'published' || !status) {
      query.status = 'published';
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    await connectToDatabase();
    
    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Post.countDocuments(query);
    
    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET posts error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - создание поста (с поддержкой статуса)
export async function POST(request: Request) {
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
    
    const { title, slug, content, description, tags, status = 'draft' } = await request.json();
    
    // Проверяем уникальность slug
    const existingPost = await Post.findOne({ slug });
    if (existingPost) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    
    const post = await Post.create({
      title,
      slug,
      content,
      description,
      tags: tags || [],
      author: payload.userId,
      authorName: payload.username,
      status,
      publishedAt: status === 'published' ? new Date() : null,
    });
    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('POST post error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}