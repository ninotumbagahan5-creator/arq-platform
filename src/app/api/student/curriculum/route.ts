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

    // Fetch all topics with their prerequisites
    const allTopics = await prisma.topic.findMany({
      include: {
        prerequisites: true
      },
      orderBy: { order: 'asc' }
    });

    // Fetch all of this student's journeys
    const studentJourneys = await prisma.journey.findMany({
      where: { studentId: userId }
    });

    // Create a map of completed topic IDs
    const completedTopicIds = new Set(
      studentJourneys.filter(j => j.status === 'completed').map(j => j.topicId)
    );
    
    // Create a map of in-progress topic IDs
    const inProgressTopicIds = new Set(
      studentJourneys.filter(j => j.status === 'in-progress').map(j => j.topicId)
    );

    // Evaluate each topic
    const evaluatedTopics = allTopics.map(topic => {
      let state = 'AVAILABLE';
      let activeJourneyId = null;

      if (completedTopicIds.has(topic.id)) {
        state = 'COMPLETED';
      } else if (inProgressTopicIds.has(topic.id)) {
        state = 'IN-PROGRESS';
        activeJourneyId = studentJourneys.find(j => j.topicId === topic.id)?.id;
      } else {
        // Check prerequisites
        const missingPrereqs = topic.prerequisites.filter(req => !completedTopicIds.has(req.id));
        if (missingPrereqs.length > 0) {
          state = 'LOCKED';
        }
      }

      return {
        ...topic,
        state,
        activeJourneyId,
        missingPrerequisites: state === 'LOCKED' ? topic.prerequisites.filter(req => !completedTopicIds.has(req.id)) : []
      };
    });

    return NextResponse.json(evaluatedTopics);

  } catch (error) {
    console.error('Student Curriculum Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
