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
    const role = sessionData.user.role;
    if (role !== 'MAKER' && role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { phaseId, title, description } = await request.json();

    if (!phaseId) return NextResponse.json({ error: 'Phase ID required' }, { status: 400 });

    const lastTheme = await prisma.theme.findFirst({ where: { phaseId }, orderBy: { order: 'desc' } });
    const order = lastTheme ? lastTheme.order + 1 : 1;

    const newTheme = await prisma.theme.create({
      data: { phaseId, title, description, order }
    });

    return NextResponse.json(newTheme);
  } catch (error) {
    console.error('Theme Create Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
