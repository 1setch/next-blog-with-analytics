import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const tag = searchParams.get('tag') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, date, views, likes
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    await connectToDatabase();
    
    const skip = (page - 1) * limit;
    let query: any = {};
    
    // Полнотекстовый поиск
    if (q) {
      query.$text = { $search: q };
    }
    
    // Фильтр по тегу
    if (tag) {
      query.tags = tag;
    }
    
    // Фильтр по дате
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    
    // Сортировка
    let sortOptions: any = {};
    switch (sortBy) {
      case 'date':
        sortOptions = { createdAt: -1 };
        break;
      case 'views':
        sortOptions = { views: -1 };
        break;
      case 'likes':
        sortOptions = { likesCount: -1 };
        break;
      default:
        sortOptions = { score: { $meta: 'textScore' }, createdAt: -1 };
    }
    
    let postsQuery = Post.find(query)
      .populate('author', 'username avatar')
      .skip(skip)
      .limit(limit);
    
    if (sortBy === 'relevance' && q) {
      postsQuery = postsQuery.sort({ score: { $meta: 'textScore' } });
    } else {
      postsQuery = postsQuery.sort(sortOptions);
    }
    
    const posts = await postsQuery.lean();
    const total = await Post.countDocuments(query);
    
    // Популярные теги для фильтрации
    const popularTags = await Post.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);
    
    return NextResponse.json({
      posts: JSON.parse(JSON.stringify(posts)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      popularTags: popularTags.map(t => ({ name: t._id, count: t.count })),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}