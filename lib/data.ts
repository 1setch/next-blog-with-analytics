import { cache } from 'react';
import { connectToDatabase } from './mongodb';
import Post from '@/models/Post';
import User from '@/models/User';

// React cache - кэширует результат на время рендера
export const getPosts = cache(async (limit = 10) => {
  await connectToDatabase();
  const posts = await Post.find()
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return JSON.parse(JSON.stringify(posts));
});

export const getPostBySlug = cache(async (slug: string) => {
  await connectToDatabase();
  const post = await Post.findOne({ slug })
    .populate('author', 'username avatar bio')
    .lean();
  return post ? JSON.parse(JSON.stringify(post)) : null;
});

export const getUserById = cache(async (id: string) => {
  await connectToDatabase();
  const user = await User.findById(id).select('-password').lean();
  return user ? JSON.parse(JSON.stringify(user)) : null;
});