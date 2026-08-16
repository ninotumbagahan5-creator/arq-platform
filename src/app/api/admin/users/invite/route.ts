import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sessionData = await decrypt(sessionCookie.value);
    if (sessionData.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, name, role, context } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and Role are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create user with a default password for MVP ("arq123")
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('arq123', salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash,
        profile: role === 'STUDENT' ? {
          create: {
            context: context || ''
          }
        } : undefined
      }
    });

    return NextResponse.json({ message: 'User invited/created successfully', user: newUser });
  } catch (error) {
    console.error('Admin Invite Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
