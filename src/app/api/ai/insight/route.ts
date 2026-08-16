import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { generateFacilitatorInsight } from '@/lib/ai';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sessionData = await decrypt(sessionCookie.value);
    
    // Only Facilitators and Admins can request insights on learners
    if (!['FACILITATOR', 'ADMIN'].includes(sessionData.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { studentId } = await request.json();
    if (!studentId) return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });

    // Fetch learner data
    const learner = await prisma.user.findUnique({
      where: { id: studentId },
      include: { profile: true }
    });

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 });
    }

    // Ensure the facilitator is assigned to this learner (unless Admin)
    if (sessionData.user.role === 'FACILITATOR' && learner.profile?.facilitatorId !== sessionData.user.id) {
       return NextResponse.json({ error: 'You are not assigned to this learner' }, { status: 403 });
    }

    // Generate insight via the AI service
    const insight = await generateFacilitatorInsight(learner);

    // Cache the insight in the database
    if (learner.profile) {
      await prisma.profile.update({
        where: { id: learner.profile.id },
        data: { aiInsights: insight }
      });
    }

    return NextResponse.json({ insight });

  } catch (error) {
    console.error('AI Insight Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
