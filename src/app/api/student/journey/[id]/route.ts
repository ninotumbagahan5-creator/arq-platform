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
    const userId = sessionData.user.id;
    
    const journey = await prisma.journey.findUnique({
      where: { id: params.id },
      include: {
        topic: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                blocks: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!journey || journey.studentId !== userId) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    return NextResponse.json(journey);
  } catch (error) {
    console.error('Journey Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sessionData = await decrypt(sessionCookie.value);
    const userId = sessionData.user.id;
    const { status } = await request.json();

    if (status !== 'completed') {
      return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
    }
    
    // Verify ownership
    const existing = await prisma.journey.findUnique({ where: { id: params.id } });
    if (!existing || existing.studentId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const journey = await prisma.journey.update({
      where: { id: params.id },
      data: { status: 'completed' }
    });

    return NextResponse.json(journey);
  } catch (error) {
    console.error('Journey Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
