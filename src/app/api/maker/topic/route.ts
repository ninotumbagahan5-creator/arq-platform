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
    if (!['MAKER', 'ADMIN'].includes(sessionData.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { themeId, title, prerequisiteIds } = await request.json();

    if (!themeId || !title) {
      return NextResponse.json({ error: 'themeId and title are required' }, { status: 400 });
    }

    // Prepare connection objects for prerequisites
    let connectPrerequisites = undefined;
    if (prerequisiteIds && Array.isArray(prerequisiteIds) && prerequisiteIds.length > 0) {
      connectPrerequisites = prerequisiteIds.map(id => ({ id }));
    }

    const topic = await prisma.topic.create({
      data: {
        themeId,
        title,
        prerequisites: connectPrerequisites ? { connect: connectPrerequisites } : undefined,
        lessons: {
          create: {
            title: 'Lesson 1', // Automatically create the first lesson scaffolding
          }
        }
      }
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error('Topic Creation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
