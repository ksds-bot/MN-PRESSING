import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';

// GET /api/orders/alerts -> commandes en retard (date de retrait dépassée, pas encore prêtes/livrées)
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    const overdueOrders = await prisma.order.findMany({
      where: {
        AND: [
          auth.user.role === 'ADMIN' ? {} : { createdById: auth.user.id },
          { expectedReturnDate: { lt: now } },
          { status: { in: ['RECEIVED', 'WASHING', 'IRONING'] } },
        ],
      },
      include: {
        customer: { select: { fullName: true, phoneNumber: true } },
      },
      orderBy: { expectedReturnDate: 'asc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      count: overdueOrders.length,
      orders: overdueOrders.map((o) => ({
        id: o.id,
        receiptNumber: o.receiptNumber,
        customerName: o.customer.fullName,
        expectedReturnDate: o.expectedReturnDate,
        status: o.status,
      })),
    });
  } catch (error) {
    console.error('Alerts error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
