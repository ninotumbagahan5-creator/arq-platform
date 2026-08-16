import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sessionData = await decrypt(sessionCookie.value);
    const userId = sessionData.user.id;

    const journeys = await prisma.journey.findMany({
      where: { studentId: userId },
      include: {
        topic: {
          include: {
            lessons: true // include lessons so we can show total progress
          }
        }
      }
    });

    return NextResponse.json(journeys);
  } catch (error) {
    console.error('Journey Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sessionData = await decrypt(sessionCookie.value);
    const userId = sessionData.user.id;

    const { topicId } = await request.json();
    if (!topicId) return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });

    // Check if already enrolled
    const existing = await prisma.journey.findFirst({
      where: { studentId: userId, topicId }
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Get the first lesson and block to start the journey
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          take: 1,
          include: {
            blocks: {
              orderBy: { order: 'asc' },
              take: 1
            }
          }
        }
      }
    });

    const currentLessonId = topic?.lessons[0]?.id || null;
    const currentBlockId = topic?.lessons[0]?.blocks[0]?.id || null;

    const newJourney = await prisma.journey.create({
      data: {
        studentId: userId,
        topicId,
        currentLessonId,
        currentBlockId,
        status: 'in-progress'
      }
    });

    return NextResponse.json(newJourney);
  } catch (error) {
    console.error('Journey Create Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
