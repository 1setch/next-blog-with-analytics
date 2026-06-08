import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // ДОБАВЛЯЕМ await
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const users = await User.find(
      { _id: { $ne: payload.userId } },
      'username avatar'
    ).limit(50);
    
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}