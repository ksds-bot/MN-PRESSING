import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/orders/[receiptNumber] -> suivi client, sans authentification
// N'expose que les informations utiles au client : statut, vêtements, observations, paiement.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ receiptNumber: string }> }
) {
  try {
    const { receiptNumber } = await params;

    if (!receiptNumber) {
      return NextResponse.json(
        { success: false, error: 'Numéro de reçu manquant' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { receiptNumber },
      select: {
        receiptNumber: true,
        status: true,
        depositDate: true,
        expectedReturnDate: true,
        deliveryDate: true,
        observations: true,
        totalPrice: true,
        paidAmount: true,
        remainingAmount: true,
        customer: {
          select: {
            fullName: true,
          },
        },
        garments: {
          select: {
            id: true,
            type: true,
            description: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable. Vérifiez le lien fourni.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Public order lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
