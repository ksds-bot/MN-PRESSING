'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Garment {
  id: string;
  type: string;
  description: string;
}

interface Photo {
  id: string;
  url: string;
}

interface OrderHistoryItem {
  id: string;
  receiptNumber: string;
  status: string;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  depositDate: string;
  garments: Garment[];
  photos: Photo[];
}

interface CustomerDetail {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  orders: OrderHistoryItem[];
  totalSpent: number;
  totalOrders: number;
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomer = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Client introuvable');
        setLoading(false);
        return;
      }

      setCustomer(data.customer);
      setLoading(false);
    } catch (err) {
      setError('Erreur serveur');
      setLoading(false);
    }
  }, [customerId, router]);

  useEffect(() => {
    if (customerId) fetchCustomer();
  }, [customerId, fetchCustomer]);

  const bgStyle = {
    background: 'linear-gradient(160deg, #FDF2F8 0%, #FFFFFF 40%, #E0F2FE 100%)',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <p className="text-slate-400 text-sm">Chargement...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={bgStyle}>
        <div
          className="bg-white rounded-2xl p-6 text-center max-w-sm"
          style={{ boxShadow: '0 4px 20px -6px rgba(26,26,46,0.08)' }}
        >
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-white px-5 py-2.5 rounded-xl font-medium text-sm"
            style={{ background: '#C81E6E' }}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

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

      <div className="max-w-2xl mx-auto px-4 py-6 relative">
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 mb-4 flex items-center gap-1"
        >
          ← Retour
        </button>

        {/* Fiche client */}
        <div
          className="bg-white rounded-2xl p-5 mb-5"
          style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
        >
          <h1
            className="text-xl font-bold mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
          >
            {customer.fullName}
          </h1>
          <p className="text-sm text-slate-400">{customer.phoneNumber}</p>
          {customer.email && <p className="text-sm text-slate-400">{customer.email}</p>}
          <p className="text-xs text-slate-400 mt-1">
            Client depuis le {formatDate(customer.createdAt)}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl p-3" style={{ background: '#FDF2F8' }}>
              <p className="text-xs text-slate-500">Total commandes</p>
              <p className="text-xl font-bold" style={{ color: '#C81E6E' }}>
                {customer.totalOrders}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: '#E0F2FE' }}>
              <p className="text-xs text-slate-500">Total dépensé</p>
              <p className="text-xl font-bold" style={{ color: '#0369A1' }}>
                {customer.totalSpent.toLocaleString()} <span className="text-xs">FCFA</span>
              </p>
            </div>
          </div>
        </div>

        {/* Historique commandes */}
        <h2
          className="font-semibold mb-3"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
        >
          Historique des commandes
        </h2>

        {customer.orders.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-6 text-center"
            style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
          >
            <p className="text-slate-400 text-sm italic">Aucune commande enregistrée.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customer.orders.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/commandes/${order.id}`)}
                className="w-full text-left bg-white rounded-2xl p-4 transition-transform active:scale-[0.98]"
                style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-slate-400">
                    {formatDate(order.depositDate)} · Reçu {order.receiptNumber.slice(0, 8)}
                  </p>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: STATUS_COLORS[order.status]?.bg,
                      color: STATUS_COLORS[order.status]?.text,
                    }}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mb-2">
                  {order.garments.map((g) => g.type).join(', ')}
                </p>

                {order.photos.length > 0 && (
                  <div className="flex gap-1.5 mb-2">
                    {order.photos.slice(0, 4).map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id}
                        src={p.url}
                        alt="vêtement"
                        className="w-10 h-10 object-cover rounded-lg"
                        style={{ border: '1px solid #F1F5F9' }}
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">
                    {order.totalPrice.toLocaleString()} FCFA total
                  </span>
                  <span className="font-semibold" style={{ color: '#C81E6E' }}>
                    {order.remainingAmount > 0
                      ? `${order.remainingAmount.toLocaleString()} FCFA dû`
                      : 'Soldé'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
