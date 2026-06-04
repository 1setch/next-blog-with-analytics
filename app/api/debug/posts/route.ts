import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectToDatabase();
    
    const posts = await Post.find()
      .select('title slug _id')
      .lean();
    
    console.log('🐛 [DEBUG] Все посты в БД:', posts);
    
    return NextResponse.json({
      count: posts.length,
      posts: posts.map(p => ({
        id: p._id,
        title: p.title,
        slug: p.slug
      }))
    });
  } catch (error) {
    console.error('🐛 [DEBUG] Ошибка:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}