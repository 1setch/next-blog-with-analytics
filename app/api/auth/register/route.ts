import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setTokenCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const { username, email, password } = await request.json();
    
    // Проверяем существование пользователя
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаем пользователя
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });
    
    // Создаем токен
    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email
    });
    
    // Создаем ответ с токеном в cookie
    const response = NextResponse.json({
      message: 'Registration successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    }, { status: 201 });
    
    setTokenCookie(response, token);
    return response;
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}