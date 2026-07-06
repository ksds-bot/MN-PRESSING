import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

async function getPeriodStats(start: Date, end: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
    },
    select: {
      totalPrice: true,
      paidAmount: true,
      remainingAmount: true,
    },
  });

  const count = orders.length;
  const revenue = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const remaining = orders.reduce((sum, o) => sum + o.remainingAmount, 0);
  const totalValue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  return { count, revenue, remaining, totalValue };
}

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 });
  }

  try {
    const now = new Date();

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [today, yesterdayStats, week, month, year] = await Promise.all([
      getPeriodStats(todayStart, todayEnd),
      getPeriodStats(yesterdayStart, yesterdayEnd),
      getPeriodStats(weekStart, now),
      getPeriodStats(monthStart, now),
      getPeriodStats(yearStart, now),
    ]);

    // Répartition des commandes par statut (pour graphique)
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Chiffre d'affaires des 7 derniers jours (pour graphique)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayStats = await getPeriodStats(startOfDay(day), endOfDay(day));
      last7Days.push({
        date: day.toISOString().slice(0, 10),
        revenue: dayStats.revenue,
        count: dayStats.count,
      });
    }

    return NextResponse.json({
      success: true,
      today,
      yesterday: yesterdayStats,
      week,
      month,
      year,
      statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count.status })),
      last7Days,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
