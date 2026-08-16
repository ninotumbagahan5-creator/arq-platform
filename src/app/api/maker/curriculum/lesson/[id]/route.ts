import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sessionData = await decrypt(sessionCookie.value);
    if (!['MAKER', 'ADMIN'].includes(sessionData.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        blocks: {
          orderBy: { order: 'asc' }
        },
        topic: true
      }
    });

    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Lesson Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
