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

    const { lessonId, blockType, content } = await request.json();
    if (!lessonId || !blockType) return NextResponse.json({ error: 'Lesson ID and Block Type required' }, { status: 400 });

    const lastBlock = await prisma.block.findFirst({ where: { lessonId }, orderBy: { order: 'desc' } });
    const order = lastBlock ? lastBlock.order + 1 : 1;

    // content is a JSON string
    const newBlock = await prisma.block.create({
      data: { lessonId, blockType, content, order }
    });

    return NextResponse.json(newBlock);
  } catch (error) {
    console.error('Block Create Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
