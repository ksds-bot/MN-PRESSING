'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  receiptNumber: string;
  status: string;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  depositDate: string;
  expectedReturnDate: string;
  customer: {
    fullName: string;
    phoneNumber: string;
  };
  garments: { id: string; type: string }[];
  createdBy: { id: string; name: string; email: string } | null;
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

export default function CommandesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/orders/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchOrders]);

  const bgStyle = {
    background: 'linear-gradient(160deg, #FDF2F8 0%, #FFFFFF 40%, #E0F2FE 100%)',
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={bgStyle}>
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: '#C81E6E' }}
      />
      <div
        className="absolute top-40 -right-16 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: '#87CEEB' }}
      />

      <div className="max-w-3xl mx-auto px-4 py-6 relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
            >
              Commandes
            </h1>
            <p className="text-xs text-slate-400 italic">MN Pressing</p>
          </div>
          <button
            onClick={() => router.push('/commandes/nouvelle')}
            className="text-sm font-medium px-4 py-2.5 rounded-xl text-white"
            style={{
              background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
              boxShadow: '0 8px 20px -8px rgba(200, 30, 110, 0.5)',
            }}
          >
            + Commande
          </button>
        </div>

        {/* Barre de recherche */}
        <div
          className="bg-white rounded-2xl p-4 mb-4"
          style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
        >
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou n° reçu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none text-sm mb-3"
            onFocus={(e) => {
              e.target.style.boxShadow = '0 0 0 3px rgba(200, 30, 110, 0.15)';
              e.target.style.borderColor = '#C81E6E';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
              e.target.style.borderColor = '';
            }}
          />

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: statusFilter === '' ? '#1A1A2E' : '#F1F5F9',
                color: statusFilter === '' ? '#FFFFFF' : '#64748B',
              }}
            >
              Tous
            </button>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: statusFilter === key ? STATUS_COLORS[key].bg : '#F1F5F9',
                  color: statusFilter === key ? STATUS_COLORS[key].text : '#64748B',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <p className="text-center text-slate-400 text-sm py-8">Chargement...</p>
        ) : error ? (
          <p className="text-center text-red-500 text-sm py-8">{error}</p>
        ) : orders.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-8 text-center"
            style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
          >
            <p className="text-slate-400 text-sm italic">Aucune commande trouvée.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/commandes/${order.id}`)}
                className="w-full text-left bg-white rounded-2xl p-4 transition-transform active:scale-[0.98]"
                style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>
                      {order.customer.fullName}
                    </p>
                    <p className="text-xs text-slate-400">{order.customer.phoneNumber}</p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: STATUS_COLORS[order.status]?.bg || '#F1F5F9',
                      color: STATUS_COLORS[order.status]?.text || '#64748B',
                    }}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>
                    {order.garments.length} vêtement{order.garments.length > 1 ? 's' : ''} · Reçu{' '}
                    {order.receiptNumber.slice(0, 8)}
                  </span>
                  <span className="font-semibold" style={{ color: '#C81E6E' }}>
                    {order.remainingAmount > 0
                      ? `${order.remainingAmount.toLocaleString()} FCFA dû`
                      : 'Soldé'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 italic">
                  Enregistré par {order.createdBy?.name || 'Inconnu'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
