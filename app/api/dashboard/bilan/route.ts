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

async function getStats(start: Date, end: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { totalPrice: true, paidAmount: true, remainingAmount: true },
  });

  return {
    count: orders.length,
    revenue: orders.reduce((s, o) => s + o.paidAmount, 0),
    remaining: orders.reduce((s, o) => s + o.remainingAmount, 0),
  };
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
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

    // Aujourd'hui vs Hier
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    // Cette semaine vs semaine précédente
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setMilliseconds(-1);

    // Ce mois vs mois précédent
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(monthStart.getTime() - 1);

    // Cette année vs année précédente
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevYearEnd = new Date(yearStart.getTime() - 1);

    const [
      today,
      yesterdayStats,
      week,
      prevWeek,
      month,
      prevMonth,
      year,
      prevYear,
    ] = await Promise.all([
      getStats(todayStart, todayEnd),
      getStats(yesterdayStart, yesterdayEnd),
      getStats(weekStart, now),
      getStats(prevWeekStart, prevWeekEnd),
      getStats(monthStart, now),
      getStats(prevMonthStart, prevMonthEnd),
      getStats(yearStart, now),
      getStats(prevYearStart, prevYearEnd),
    ]);

    return NextResponse.json({
      success: true,
      today: { ...today, changeVsPrevious: percentChange(today.revenue, yesterdayStats.revenue) },
      yesterday: yesterdayStats,
      week: { ...week, changeVsPrevious: percentChange(week.revenue, prevWeek.revenue) },
      prevWeek,
      month: { ...month, changeVsPrevious: percentChange(month.revenue, prevMonth.revenue) },
      prevMonth,
      year: { ...year, changeVsPrevious: percentChange(year.revenue, prevYear.revenue) },
      prevYear,
    });
  } catch (error) {
    console.error('Bilan error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
