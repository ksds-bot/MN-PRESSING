'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import OverdueAlert from '@/app/components/OverdueAlert';
import PressingBackground from '@/app/components/PressingBackground';
import AppMenu from '@/app/components/AppMenu';

interface Order {
  id: string;
  receiptNumber: string;
  status: string;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  depositDate: string;
  expectedReturnDate: string;
  createdAt: string;
  customer: {
    fullName: string;
    phoneNumber: string;
  };
  garments: { id: string; type: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Reçu',
  WASHING: 'En lavage',
  IRONING: 'En repassage',
  READY: 'Prêt',
  DELIVERED: 'Livré',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  RECEIVED: { bg: '#E0F2FE', text: '#0369A1' },
  WASHING: { bg: '#DBEAFE', text: '#1D4ED8' },
  IRONING: { bg: '#FEF3C7', text: '#B45309' },
  READY: { bg: '#FCE7F3', text: '#C81E6E' },
  DELIVERED: { bg: '#DCFCE7', text: '#15803D' },
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function TableauEmployePage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      setUserName(user.name || '');

      if (user.role === 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      try {
        const res = await fetch('/api/orders/search', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        if (!result.success) {
          setError(result.error || 'Erreur lors du chargement des commandes');
          setLoading(false);
          return;
        }

        setOrders(result.orders);
        setLoading(false);
      } catch (err) {
        setError('Erreur serveur, réessayez.');
        setLoading(false);
      }
    }

    fetchOrders();
  }, [router]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayOrders = orders.filter((o) => isSameDay(new Date(o.createdAt), today));
    const pending = orders.filter((o) => o.status !== 'DELIVERED');
    const ready = orders.filter((o) => o.status === 'READY');
    const remainingTotal = orders.reduce((sum, o) => sum + o.remainingAmount, 0);

    return {
      todayCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + o.paidAmount, 0),
      pendingCount: pending.length,
      readyCount: ready.length,
      remainingTotal,
    };
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 8), [orders]);

  const bgStyle = {
    background: 'var(--bg-gradient)',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={bgStyle}>
        <PressingBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="washing-machine animate-spin-slow">
            <div className="drum" />
            <div className="clothes animate-spin-slower" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={bgStyle}>
        <PressingBackground />
        <div className="glass-card rounded-2xl shadow-premium p-6 text-center max-w-sm relative z-10 animate-scale-in">
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-transform hover:-translate-y-0.5"
            style={{ background: '#C81E6E' }}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={bgStyle}>
      <PressingBackground />

      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        <div className="flex justify-between items-center mb-6 animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
              MN <span className="text-gradient-pressing">Pressing</span>
            </h1>
            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
              {userName ? `Bonjour ${userName}` : 'Mon espace'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/commandes/nouvelle')}
              className="btn-shimmer text-sm font-medium px-4 py-2.5 rounded-xl text-white transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
                boxShadow: '0 8px 20px -8px rgba(200, 30, 110, 0.5)',
              }}
            >
              + Commande
            </button>
            <AppMenu />
          </div>
        </div>

        <OverdueAlert />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div
            className="rounded-2xl p-5 relative overflow-hidden animate-fade-up"
            style={{
              background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
              boxShadow: '0 12px 28px -8px rgba(200, 30, 110, 0.45)',
            }}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 animate-pulse-glow" />
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 relative" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Aujourd&apos;hui
            </p>
            <p className="text-3xl font-bold mb-0.5 text-white font-display relative">
              {stats.todayCount}
            </p>
            <p className="text-xs mb-3 relative" style={{ color: 'rgba(255,255,255,0.65)' }}>
              commande{stats.todayCount > 1 ? 's' : ''} créée{stats.todayCount > 1 ? 's' : ''}
            </p>
            <p className="text-lg font-semibold text-white relative">
              {stats.todayRevenue.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
            </p>
          </div>

          <div
            className="rounded-2xl p-5 animate-fade-up transition-transform hover:-translate-y-1"
            style={{ background: 'var(--card-solid)', boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)', animationDelay: '60ms' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>En cours</p>
            <p className="text-3xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              {stats.pendingCount}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>non livrées</p>
          </div>

          <div
            className="rounded-2xl p-5 animate-fade-up transition-transform hover:-translate-y-1"
            style={{ background: 'var(--card-solid)', boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)', animationDelay: '120ms' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Prêtes</p>
            <p className="text-3xl font-bold font-display" style={{ color: '#C81E6E' }}>
              {stats.readyCount}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>à récupérer</p>
          </div>

          <div
            className="rounded-2xl p-5 animate-fade-up transition-transform hover:-translate-y-1"
            style={{ background: 'var(--card-solid)', boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)', animationDelay: '180ms' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Restant dû</p>
            <p className="text-2xl font-bold font-display" style={{ color: '#EA580C' }}>
              {stats.remainingTotal.toLocaleString()}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>FCFA sur mes commandes</p>
          </div>
        </div>

        <div
          className="glass-card rounded-2xl p-6 shadow-premium-sm animate-fade-up"
          style={{ animationDelay: '240ms' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #C81E6E, #87CEEB)' }} />
              <h2 className="font-semibold font-display" style={{ color: 'var(--text-primary)' }}>
                Mes commandes récentes
              </h2>
            </div>
            <button
              onClick={() => router.push('/commandes')}
              className="text-xs font-medium hover:underline"
              style={{ color: '#C81E6E' }}
            >
              Voir tout →
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Aucune commande enregistrée pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => {
                const statusStyle = STATUS_COLORS[o.status] || { bg: '#F1F5F9', text: '#475569' };
                return (
                  <div
                    key={o.id}
                    onClick={() => router.push(`/commandes/${o.id}`)}
                    className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all hover:shadow-sm hover:-translate-y-0.5"
                    style={{ border: '1px solid var(--border-soft)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{o.customer.fullName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {o.receiptNumber} · {o.garments.length} vêtement{o.garments.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2"
                      style={{ background: statusStyle.bg, color: statusStyle.text }}
                    >
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
