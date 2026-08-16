import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sessionData = await decrypt(sessionCookie.value);
    if (!['MAKER', 'ADMIN'].includes(sessionData.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { topicId, title, description } = await request.json();
    if (!topicId) return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });

    const lastLesson = await prisma.lesson.findFirst({ where: { topicId }, orderBy: { order: 'desc' } });
    const order = lastLesson ? lastLesson.order + 1 : 1;

    const newLesson = await prisma.lesson.create({
      data: { topicId, title, description, order }
    });

    return NextResponse.json(newLesson);
  } catch (error) {
    console.error('Lesson Create Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
