import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
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
    if (!payload || payload.email !== 'admin@example.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Общая статистика
    const totalPosts = await Post.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalViews = await Post.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    
    // Статистика лайков
    const totalLikes = await Like.countDocuments();
    const avgLikesPerPost = totalPosts > 0 ? (totalLikes / totalPosts).toFixed(1) : 0;
    
    // Посты с наибольшим количеством лайков
    const topLikedPosts = await Post.find()
      .sort({ likesCount: -1 })
      .limit(5)
      .select('title slug likesCount views');
    
    // Посты по дням (последние 30 дней) - ИСПРАВЛЕНО с учетом часового пояса
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    // Смещение часового пояса (Москва UTC+3)
    const timezoneOffset = 3; // Для Москвы. Для другого города измени значение
    
    const postsByDay = await Post.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $addFields: {
          localDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $add: ['$createdAt', timezoneOffset * 60 * 60 * 1000] }
            }
          }
        }
      },
      {
        $group: {
          _id: '$localDate',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Пользователи по дням
    const usersByDay = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $addFields: {
          localDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $add: ['$createdAt', timezoneOffset * 60 * 60 * 1000] }
            }
          }
        }
      },
      {
        $group: {
          _id: '$localDate',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Лайки по дням
    const likesByDay = await Like.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $addFields: {
          localDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $add: ['$createdAt', timezoneOffset * 60 * 60 * 1000] }
            }
          }
        }
      },
      {
        $group: {
          _id: '$localDate',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Топ тегов
    const topTags = await Post.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Топ авторов по постам
    const topAuthors = await Post.aggregate([
      { $group: { _id: '$authorName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Топ авторов по лайкам
    const topAuthorsByLikes = await Post.aggregate([
      { $group: { 
        _id: '$authorName', 
        totalLikes: { $sum: '$likesCount' },
        postCount: { $sum: 1 }
      } },
      { $sort: { totalLikes: -1 } },
      { $limit: 5 }
    ]);
    
    // Топ постов по просмотрам
    const topPosts = await Post.find()
      .sort({ views: -1 })
      .limit(5)
      .select('title views slug');
    
    // Активность по часам (с учетом часового пояса)
    const activityByHourPosts = await Post.aggregate([
      {
        $addFields: {
          localHour: { $hour: { $add: ['$createdAt', timezoneOffset * 60 * 60 * 1000] } }
        }
      },
      {
        $group: {
          _id: '$localHour',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Активность лайков по часам
    const activityByHourLikes = await Like.aggregate([
      {
        $addFields: {
          localHour: { $hour: { $add: ['$createdAt', timezoneOffset * 60 * 60 * 1000] } }
        }
      },
      {
        $group: {
          _id: '$localHour',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Объединяем активность по часам для графика
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const activityData = hours.map(hour => {
      const posts = activityByHourPosts.find(a => a._id === hour)?.count || 0;
      const likes = activityByHourLikes.find(a => a._id === hour)?.count || 0;
      return {
        hour: `${hour}:00`,
        hourNum: hour,
        posts,
        likes,
        total: posts + likes
      };
    });
    
    // Соотношение лайков к просмотрам
    const engagementRate = totalViews[0]?.total > 0 
      ? ((totalLikes / totalViews[0].total) * 100).toFixed(1)
      : 0;
    
    return NextResponse.json({
      total: {
        posts: totalPosts,
        users: totalUsers,
        views: totalViews[0]?.total || 0,
        likes: totalLikes,
        avgLikesPerPost,
        engagementRate
      },
      postsByDay,
      usersByDay,
      likesByDay,
      topTags: topTags.map(t => ({ name: t._id, value: t.count })),
      topAuthors,
      topAuthorsByLikes,
      topPosts,
      topLikedPosts,
      activityData
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}