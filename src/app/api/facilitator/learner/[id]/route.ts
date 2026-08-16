import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
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

    const studentId = resolvedParams.id;

    // Verify this learner belongs to this facilitator
    const learner = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        profile: true,
        journeys: {
          where: { status: 'in-progress' },
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
        }
      }
    });

    if (!learner || (learner.profile?.facilitatorId !== userId && role === 'FACILITATOR')) {
      return NextResponse.json({ error: 'Learner not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(learner);
  } catch (error) {
    console.error('Learner Context Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
