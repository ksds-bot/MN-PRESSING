import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';

// GET /api/customers/[id] -> fiche client + historique complet des commandes
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          where: auth.user.role === 'ADMIN' ? undefined : { createdById: auth.user.id },
          include: {
            garments: true,
            photos: true,
            payments: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Client introuvable' }, { status: 404 });
    }

    const totalSpent = customer.orders.reduce((sum, o) => sum + o.paidAmount, 0);
    const totalOrders = customer.orders.length;

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        notes: customer.notes,
        createdAt: customer.createdAt,
        orders: customer.orders,
        totalSpent,
        totalOrders,
      },
    });
  } catch (error) {
    console.error('Customer detail error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
