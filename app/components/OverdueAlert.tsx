'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OverdueOrder {
  id: string;
  receiptNumber: string;
  customerName: string;
  expectedReturnDate: string;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Reçu',
  WASHING: 'En lavage',
  IRONING: 'En repassage',
};

function daysLate(dateStr: string): number {
  const expected = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - expected.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function OverdueAlert() {
  const router = useRouter();
  const [orders, setOrders] = useState<OverdueOrder[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/orders/alerts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        // silencieux : une alerte ne doit jamais casser la page
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  if (loading || orders.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 mb-6 animate-fade-up"
      style={{
        background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
        border: '1px solid #FCA5A5',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 animate-pulse-glow"
            style={{ background: '#EF4444' }}
          >
            ⚠️
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm" style={{ color: '#991B1B' }}>
              {orders.length} commande{orders.length > 1 ? 's' : ''} en retard
            </p>
            <p className="text-xs" style={{ color: '#B91C1C' }}>
              La date de retrait prévue est dépassée
            </p>
          </div>
        </div>
        <span className="text-xs font-medium transition-transform" style={{ color: '#B91C1C' }}>
          {expanded ? 'Réduire ▲' : 'Voir ▼'}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-fade-in">
          {orders.map((o, i) => (
            <button
              key={o.id}
              onClick={() => router.push(`/commandes/${o.id}`)}
              className="w-full text-left bg-white rounded-xl p-3 flex justify-between items-center transition-transform hover:-translate-y-0.5 hover:shadow-sm animate-fade-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>
                  {o.customerName}
                </p>
                <p className="text-xs text-slate-400">
                  {STATUS_LABELS[o.status]} · Reçu {o.receiptNumber.slice(0, 8)}
                </p>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: '#FEE2E2', color: '#DC2626' }}
              >
                {daysLate(o.expectedReturnDate)}j de retard
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
