import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';

// GET /api/orders/export
// Liste des commandes déposées il y a plus de 7 jours (dépôt >= 7 jours),
// avec client, vêtements (nombre), montants payé/restant. Sans photos.
// Réservé aux administrateurs.
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        depositDate: { lte: sevenDaysAgo },
      },
      select: {
        id: true,
        receiptNumber: true,
        depositDate: true,
        expectedReturnDate: true,
        deliveryDate: true,
        status: true,
        totalPrice: true,
        paidAmount: true,
        remainingAmount: true,
        observations: true,
        customer: {
          select: { fullName: true, phoneNumber: true },
        },
        garments: {
          select: { id: true, type: true },
        },
      },
      orderBy: { depositDate: 'asc' },
    });

    const rows = orders.map((o) => ({
      id: o.id,
      receiptNumber: o.receiptNumber,
      customerName: o.customer.fullName,
      customerPhone: o.customer.phoneNumber,
      depositDate: o.depositDate,
      expectedReturnDate: o.expectedReturnDate,
      deliveryDate: o.deliveryDate,
      status: o.status,
      garmentsCount: o.garments.length,
      totalPrice: o.totalPrice,
      paidAmount: o.paidAmount,
      remainingAmount: o.remainingAmount,
      observations: o.observations,
    }));

    const totals = rows.reduce(
      (acc, r) => {
        acc.garmentsCount += r.garmentsCount;
        acc.totalPrice += r.totalPrice;
        acc.paidAmount += r.paidAmount;
        acc.remainingAmount += r.remainingAmount;
        return acc;
      },
      { garmentsCount: 0, totalPrice: 0, paidAmount: 0, remainingAmount: 0 }
    );

    return NextResponse.json({
      success: true,
      count: rows.length,
      totals,
      orders: rows,
    });
  } catch (error) {
    console.error('Orders export error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
