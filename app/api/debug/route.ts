import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectToDatabase();
  const posts = await Post.find().select('title slug');
  return NextResponse.json(posts);
}