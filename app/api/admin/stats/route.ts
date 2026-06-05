import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import Like from '@/models/Like';
import Comment from '@/models/Comment';
import Message from '@/models/Message';
import PrivateMessage from '@/models/PrivateMessage';
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
    const totalLikes = await Like.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalPublicMessages = await Message.countDocuments();
    const totalPrivateMessages = await PrivateMessage.countDocuments();
    
    // Активные диалоги (где есть хотя бы одно сообщение)
    const activeDialogs = await PrivateMessage.distinct('fromUserId', {
      $or: [
        { fromUserId: { $exists: true } },
        { toUserId: { $exists: true } }
      ]
    });
    
    // Сообщения в день (в среднем за последние 30 дней)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const messagesLast30Days = await PrivateMessage.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const avgMessagesPerDay = Math.round(messagesLast30Days / 30);
    
    // Посты в день
    const postsByDay = await getStatsByDay(Post, thirtyDaysAgo);
    const usersByDay = await getStatsByDay(User, thirtyDaysAgo);
    const likesByDay = await getStatsByDay(Like, thirtyDaysAgo);
    const commentsByDay = await getStatsByDay(Comment, thirtyDaysAgo);
    
    // Активность по часам для чатов
    const timezoneOffset = 3;
    const messageActivityByHour = await PrivateMessage.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
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
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const messageActivityData = hours.map(hour => ({
      hour: `${hour}:00`,
      count: messageActivityByHour.find(a => a._id === hour)?.count || 0
    }));
    
    // Топ тегов
    const topTags = await Post.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
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
    
    // Топ авторов по комментариям
    const topAuthorsByComments = await Comment.aggregate([
      { $group: { 
        _id: '$authorName', 
        totalComments: { $sum: 1 },
        postCount: { $sum: 1 }
      } },
      { $sort: { totalComments: -1 } },
      { $limit: 5 }
    ]);
    
    // Топ постов по просмотрам
    const topPosts = await Post.find()
      .sort({ views: -1 })
      .limit(5)
      .select('title views slug');
    
    // Топ постов по лайкам
    const topLikedPosts = await Post.find()
      .sort({ likesCount: -1 })
      .limit(5)
      .select('title slug likesCount views');
    
    // Активность по часам (посты + лайки)
    const activityByHourPosts = await Post.aggregate([
      {
        $addFields: {
          localHour: { $hour: { $add: ['$createdAt', timezoneOffset * 60 * 60 * 1000] } }
        }
      },
      { $group: { _id: '$localHour', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const activityByHourLikes = await Like.aggregate([
      {
        $addFields: {
          localHour: { $hour: { $add: ['$createdAt', timezoneOffset * 60 * 60 * 1000] } }
        }
      },
      { $group: { _id: '$localHour', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const activityData = hours.map(hour => {
      const posts = activityByHourPosts.find(a => a._id === hour)?.count || 0;
      const likes = activityByHourLikes.find(a => a._id === hour)?.count || 0;
      return {
        hour: `${hour}:00`,
        posts,
        likes,
        total: posts + likes
      };
    });
    
    // Дополнительные метрики
    const avgLikesPerPost = totalPosts > 0 ? (totalLikes / totalPosts).toFixed(1) : 0;
    const avgCommentsPerPost = totalPosts > 0 ? (totalComments / totalPosts).toFixed(1) : 0;
    const avgViewsPerPost = totalPosts > 0 ? Math.round((totalViews[0]?.total || 0) / totalPosts) : 0;
    const avgPostsPerUser = totalUsers > 0 ? (totalPosts / totalUsers).toFixed(1) : 0;
    const engagementRate = totalViews[0]?.total > 0 
      ? ((totalLikes / totalViews[0].total) * 100).toFixed(1)
      : 0;
    const likesToViewsRatio = totalViews[0]?.total > 0
      ? ((totalLikes / totalViews[0].total) * 100).toFixed(1)
      : 0;
    
    // Активность сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayActivity = await Post.countDocuments({ createdAt: { $gte: today } }) +
      await Like.countDocuments({ createdAt: { $gte: today } }) +
      await Comment.countDocuments({ createdAt: { $gte: today } });
    
    return NextResponse.json({
      total: {
        posts: totalPosts,
        users: totalUsers,
        views: totalViews[0]?.total || 0,
        likes: totalLikes,
        comments: totalComments,
        publicMessages: totalPublicMessages,
        privateMessages: totalPrivateMessages
      },
      totalPublicMessages,
      totalPrivateMessages,
      activeDialogs: activeDialogs.length,
      avgMessagesPerDay,
      avgLikesPerPost,
      avgCommentsPerPost,
      avgViewsPerPost,
      avgPostsPerUser,
      engagementRate,
      likesToViewsRatio,
      todayActivity,
      postsByDay,
      usersByDay,
      likesByDay,
      commentsByDay,
      topTags: topTags.map(t => ({ name: t._id, value: t.count })),
      topAuthorsByLikes,
      topAuthorsByComments,
      topPosts,
      topLikedPosts,
      activityData,
      messageActivityByHour: messageActivityData
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Вспомогательная функция для получения статистики по дням
async function getStatsByDay(model: any, fromDate: Date) {
  const timezoneOffset = 3;
  const stats = await model.aggregate([
    { $match: { createdAt: { $gte: fromDate } } },
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
  
  return stats;
}