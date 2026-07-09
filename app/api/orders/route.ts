import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';

export interface GarmentInput {
  type: string;
  description: string;
  observations?: string;
  photoUrls?: string[];
}

// POST /api/orders -> créer une commande avec ses vêtements et photos
export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      customerId,
      depositDate,
      expectedReturnDate,
      observations,
      totalPrice,
      paidAmount,
      garments,
    }: {
      customerId: string;
      depositDate: string;
      expectedReturnDate: string;
      observations?: string;
      totalPrice: number;
      paidAmount: number;
      garments: GarmentInput[];
    } = body;

    if (!customerId || !depositDate || !expectedReturnDate || totalPrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    if (!garments || garments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Au moins un vêtement est requis' },
        { status: 400 }
      );
    }

    const remainingAmount = totalPrice - (paidAmount || 0);

    const order = await prisma.order.create({
      data: {
        customerId,
        createdById: auth.user.id,
        depositDate: new Date(depositDate),
        expectedReturnDate: new Date(expectedReturnDate),
        observations: observations || null,
        totalPrice,
        paidAmount: paidAmount || 0,
        remainingAmount,
        garments: {
          create: garments.map((g) => ({
            type: g.type,
            description: g.description,
            observations: g.observations || null,
          })),
        },
      },
      include: {
        garments: true,
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    const allPhotoUrls: { url: string; fileName: string }[] = [];
    garments.forEach((g) => {
      (g.photoUrls || []).forEach((url) => {
        allPhotoUrls.push({ url, fileName: url.split('/').pop() || 'photo.jpg' });
      });
    });

    if (allPhotoUrls.length > 0) {
      await prisma.photo.createMany({
        data: allPhotoUrls.map((p) => ({
          orderId: order.id,
          customerId: order.customerId,
          url: p.url,
          fileName: p.fileName,
        })),
      });
    }

    if (paidAmount && paidAmount > 0) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          customerId: order.customerId,
          userId: auth.user.id,
          amount: paidAmount,
          method: 'CASH',
        },
      });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET /api/orders -> liste des commandes (pour admin) ou celles créées par l'employé
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: auth.user.role === 'ADMIN' ? undefined : { createdById: auth.user.id },
      include: {
        customer: true,
        garments: true,
        photos: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
