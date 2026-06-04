import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    // Проверяем существование админа
    let admin = await User.findOne({ email: 'admin@example.com' });
    
    if (admin) {
      // Обновляем пароль если нужно
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin.password = hashedPassword;
      await admin.save();
      
      return NextResponse.json({ 
        message: 'Admin password reset',
        email: 'admin@example.com',
        password: 'admin123'
      });
    }
    
    // Создаем админа
    const hashedPassword = await bcrypt.hash('admin123', 10);
    admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      bio: 'Администратор блога',
      createdAt: new Date()
    });
    
    return NextResponse.json({ 
      message: 'Admin created successfully',
      email: 'admin@example.com',
      password: 'admin123'
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}