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

    const { themeId, title, centralQuestion, centralDiscovery, difficulty } = await request.json();
    if (!themeId) return NextResponse.json({ error: 'Theme ID required' }, { status: 400 });

    const lastTopic = await prisma.topic.findFirst({ where: { themeId }, orderBy: { order: 'desc' } });
    const order = lastTopic ? lastTopic.order + 1 : 1;

    const newTopic = await prisma.topic.create({
      data: { themeId, title, centralQuestion, centralDiscovery, difficulty: difficulty || 'foundational', order }
    });

    return NextResponse.json(newTopic);
  } catch (error) {
    console.error('Topic Create Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
