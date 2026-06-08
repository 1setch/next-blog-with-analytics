import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Наш собственный тип для payload
export interface UserPayload {
  userId: string;
  username: string;
  email: string;
}

// Функция для создания токена
export async function signToken(payload: UserPayload): Promise<string> {
  return new SignJWT(payload as any) // Используем any для обхода TypeScript
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// Функция для верификации токена
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Приводим к нашему типу
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

// Получить токен из запроса
export function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get('token')?.value;
  return token || null;
}

// Установить токен в cookie
export function setTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

// Удалить токен из cookie
export function removeTokenCookie(response: NextResponse): void {
  response.cookies.delete('token');
}