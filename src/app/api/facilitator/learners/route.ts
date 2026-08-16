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
    const role = sessionData.user.role;

    if (!['FACILITATOR', 'MAKER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get learners assigned to this facilitator
    const learners = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        profile: {
          facilitatorId: userId
        }
      },
      include: {
        profile: true,
        journeys: {
          where: { status: 'in-progress' },
          include: {
            topic: true
          }
        }
      }
    });

    // Also get unassigned learners so the facilitator can "claim" them for testing
    const unassignedLearners = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: [
          { profile: null },
          { profile: { facilitatorId: null } }
        ]
      },
      include: {
        profile: true,
        journeys: {
          where: { status: 'in-progress' },
          include: {
            topic: true
          }
        }
      }
    });

    return NextResponse.json({ learners, unassignedLearners });
  } catch (error) {
    console.error('Learners Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Claim a learner
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sessionData = await decrypt(sessionCookie.value);
    const userId = sessionData.user.id;
    const role = sessionData.user.role;

    if (!['FACILITATOR', 'MAKER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { studentId } = await request.json();
    if (!studentId) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });

    // Upsert profile to assign facilitator
    const profile = await prisma.profile.upsert({
      where: { userId: studentId },
      update: { facilitatorId: userId },
      create: { userId: studentId, facilitatorId: userId }
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Claim Learner Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
