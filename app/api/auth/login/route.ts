import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setTokenCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const { email, password } = await request.json();
    
    // Ищем пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Проверяем пароль
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Создаем токен
    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email
    });
    
    // Создаем ответ
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio
      }
    });
    
    setTokenCookie(response, token);
    return response;
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}