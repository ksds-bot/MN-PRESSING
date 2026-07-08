import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 });
  }

  try {
    const history = await prisma.loginHistory.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { loginAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Login history GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
