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

    const { title, description } = await request.json();

    // Determine the next order index
    const lastPhase = await prisma.phase.findFirst({ orderBy: { order: 'desc' } });
    const order = lastPhase ? lastPhase.order + 1 : 1;

    const newPhase = await prisma.phase.create({
      data: {
        title,
        description,
        order
      }
    });

    return NextResponse.json(newPhase);
  } catch (error) {
    console.error('Phase Create Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
