import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  try {
    const orders = await prisma.order.findMany({
      where: {
        AND: [
          auth.user.role === 'ADMIN' ? {} : { createdById: auth.user.id },
          status ? { status: status as any } : {},
          search
            ? {
                OR: [
                  { receiptNumber: { contains: search, mode: 'insensitive' } },
                  { customer: { fullName: { contains: search, mode: 'insensitive' } } },
                  { customer: { phoneNumber: { contains: search } } },
                ],
              }
            : {},
        ],
      },
      include: {
        customer: true,
        garments: true,
        photos: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Order search error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
