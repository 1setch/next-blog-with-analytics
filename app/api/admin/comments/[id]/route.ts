import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectToDatabase();
    
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload || payload.email !== 'admin@example.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    // Удаляем комментарий и все ответы на него
    await Comment.deleteMany({ parentId: id });
    await comment.deleteOne();
    
    console.log(`✅ Комментарий ${id} удален со всеми ответами`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}