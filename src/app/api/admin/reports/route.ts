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
    if (sessionData.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Aggregate basic reporting metrics
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalFacilitators = await prisma.user.count({ where: { role: 'FACILITATOR' } });
    const activeJourneys = await prisma.journey.count({ where: { status: 'in-progress' } });
    const completedJourneys = await prisma.journey.count({ where: { status: 'completed' } });

    // Most popular topics (just by count of journeys)
    const journeysByTopic = await prisma.journey.groupBy({
      by: ['topicId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    // We'd map this to actual topic titles in a real scenario
    
    return NextResponse.json({
      totalStudents,
      totalFacilitators,
      activeJourneys,
      completedJourneys
    });

  } catch (error) {
    console.error('Admin Reports Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
