import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';

// GET /api/orders/[id] -> détail d'une commande
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

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        garments: true,
        photos: true,
        payments: { orderBy: { createdAt: 'desc' } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });
    }

    if (auth.user.role !== 'ADMIN' && order.createdById !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/orders/[id] -> modifier le statut (et autres champs) d'une commande
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });
    }

    // Règle métier : seul un ADMIN peut changer le statut librement.
    // Un employé ne peut modifier que SA PROPRE commande, et seulement si
    // elle n'a pas encore été livrée.
    const isOwner = existingOrder.createdById === auth.user.id;
    const isAdmin = auth.user.role === 'ADMIN';

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    if (!isAdmin && existingOrder.status === 'DELIVERED') {
      return NextResponse.json(
        { success: false, error: 'Cette commande a déjà été livrée et ne peut plus être modifiée' },
        { status: 403 }
      );
    }

    const { status, paidAmount, observations } = body;

    const updateData: any = {};

    if (status) {
      const validStatuses = ['RECEIVED', 'WASHING', 'IRONING', 'READY', 'DELIVERED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, error: 'Statut invalide' }, { status: 400 });
      }
      updateData.status = status;
      if (status === 'DELIVERED') {
        updateData.deliveryDate = new Date();
      }
    }

    if (paidAmount !== undefined) {
      const newPaidAmount = existingOrder.paidAmount + paidAmount;
      updateData.paidAmount = newPaidAmount;
      updateData.remainingAmount = existingOrder.totalPrice - newPaidAmount;

      if (paidAmount > 0) {
        await prisma.payment.create({
          data: {
            orderId: id,
            customerId: existingOrder.customerId,
            userId: auth.user.id,
            amount: paidAmount,
            method: 'CASH',
          },
        });
      }
    }

    if (observations !== undefined) {
      updateData.observations = observations;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        garments: true,
        photos: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Order PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
