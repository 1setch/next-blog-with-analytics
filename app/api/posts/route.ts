import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// GET все посты (с пагинацией и сортировкой по дате)
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const authorId = searchParams.get('authorId');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    if (authorId) {
      query.author = authorId;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
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
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST создание поста (требует авторизацию)
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    // Проверяем авторизацию
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const body = await request.json();
    const { title, slug, content, description, tags } = body;
    
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
      authorName: payload.username
    });
    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}