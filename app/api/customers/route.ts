import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';

// GET /api/customers?search=xxx -> rechercher un client par nom ou téléphone
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phoneNumber: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    console.error('Customers GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/customers -> créer un nouveau client
export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fullName, phoneNumber, email, notes } = body;

    if (!fullName || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Nom complet et téléphone sont requis' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: { fullName, phoneNumber, email: email || null, notes: notes || null },
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error) {
    console.error('Customers POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
