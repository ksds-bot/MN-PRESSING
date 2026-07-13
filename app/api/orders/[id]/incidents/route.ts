import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';

// GET /api/orders/[id]/incidents -> liste des incidents d'une commande (staff)
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

    const incidents = await prisma.orderIncident.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        reportedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, incidents });
  } catch (error) {
    console.error('Order incidents GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/orders/[id]/incidents -> ajouter un incident/observation (Admin + Employé)
export async function POST(
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
    const message: string | undefined = body?.message?.trim();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Le message est obligatoire' },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Le message ne doit pas dépasser 500 caractères' },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });
    }

    const incident = await prisma.orderIncident.create({
      data: {
        orderId: id,
        message,
        reportedById: auth.user.id,
      },
      include: {
        reportedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, incident });
  } catch (error) {
    console.error('Order incidents POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/orders/[id]/incidents?incidentId=... -> supprimer un incident (Admin uniquement)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const incidentId = req.nextUrl.searchParams.get('incidentId');

    if (!incidentId) {
      return NextResponse.json({ success: false, error: 'incidentId manquant' }, { status: 400 });
    }

    const incident = await prisma.orderIncident.findUnique({ where: { id: incidentId } });
    if (!incident || incident.orderId !== id) {
      return NextResponse.json({ success: false, error: 'Incident introuvable' }, { status: 404 });
    }

    await prisma.orderIncident.delete({ where: { id: incidentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order incidents DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
