'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface PublicOrder {
  receiptNumber: string;
  status: string;
  depositDate: string;
  expectedReturnDate: string;
  deliveryDate: string | null;
  observations: string | null;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  customer: { fullName: string };
  garments: { id: string; type: string; description: string }[];
  incidents: { id: string; message: string; createdAt: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Reçu',
  WASHING: 'En lavage',
  IRONING: 'En repassage',
  READY: 'Prêt',
  DELIVERED: 'Livré',
};

const STATUS_ORDER = ['RECEIVED', 'WASHING', 'IRONING', 'READY', 'DELIVERED'];

const STATUS_DESCRIPTIONS: Record<string, string> = {
  RECEIVED: 'Votre commande a bien été enregistrée.',
  WASHING: 'Vos vêtements sont en cours de lavage.',
  IRONING: 'Vos vêtements sont en cours de repassage.',
  READY: 'Vos vêtements sont prêts, vous pouvez venir les récupérer.',
  DELIVERED: 'Votre commande a été livrée. Merci de votre confiance !',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SuiviCommandePage() {
  const params = useParams<{ receiptNumber: string }>();
  const receiptNumber = params?.receiptNumber ?? '';

  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/public/orders/${receiptNumber}`);
        const result = await res.json();

        if (!result.success) {
          setError(result.error || 'Commande introuvable');
          setLoading(false);
          return;
        }

        setOrder(result.order);
        setLoading(false);
      } catch (err) {
        setError('Erreur serveur, réessayez plus tard.');
        setLoading(false);
      }
    }

    if (receiptNumber) {
      fetchOrder();
    } else {
      setError('Commande introuvable');
      setLoading(false);
    }
  }, [receiptNumber]);

  const bgStyle = {
    background: 'linear-gradient(160deg, #FDF2F8 0%, #FFFFFF 40%, #E0F2FE 100%)',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <p className="text-slate-400 text-sm">Chargement de votre commande...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={bgStyle}>
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm">
          <p
            className="text-lg font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
          >
            MN <span style={{ color: '#C81E6E' }}>Pressing</span>
          </p>
          <p className="text-red-600 text-sm">{error || 'Commande introuvable'}</p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(order.status);

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

      <div className="max-w-lg mx-auto px-4 py-8 relative">
        <div className="text-center mb-6">
          <h1
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
          >
            MN <span style={{ color: '#C81E6E' }}>Pressing</span>
          </h1>
          <p className="text-xs text-slate-400">Suivi de commande</p>
        </div>

        <div
          className="rounded-2xl p-6 mb-5 text-center"
          style={{
            background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
            boxShadow: '0 12px 28px -8px rgba(200, 30, 110, 0.45)',
          }}
        >
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {order.receiptNumber}
          </p>
          <p className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {STATUS_LABELS[order.status] || order.status}
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {STATUS_DESCRIPTIONS[order.status]}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 mb-5" style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}>
          <div className="flex items-center justify-between">
            {STATUS_ORDER.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div
                    className="absolute top-3 right-1/2 w-full h-0.5"
                    style={{ background: i <= currentIndex ? '#C81E6E' : '#E2E8F0', zIndex: 0 }}
                  />
                )}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center relative z-10 text-xs font-bold"
                  style={{
                    background: i <= currentIndex ? '#C81E6E' : '#E2E8F0',
                    color: i <= currentIndex ? '#fff' : '#94A3B8',
                  }}
                >
                  {i <= currentIndex ? '✓' : ''}
                </div>
                <p
                  className="text-[10px] text-center mt-1.5 leading-tight"
                  style={{ color: i <= currentIndex ? '#1A1A2E' : '#94A3B8' }}
                >
                  {STATUS_LABELS[s]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #C81E6E, #87CEEB)' }} />
            <h2 className="font-semibold text-sm" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}>
              Détails
            </h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Client</span>
              <span className="text-slate-700 font-medium">{order.customer.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date de dépôt</span>
              <span className="text-slate-700">{formatDate(order.depositDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date prévue</span>
              <span className="text-slate-700">{formatDate(order.expectedReturnDate)}</span>
            </div>
            {order.deliveryDate && (
              <div className="flex justify-between">
                <span className="text-slate-400">Date de livraison</span>
                <span className="text-slate-700">{formatDate(order.deliveryDate)}</span>
              </div>
            )}
          </div>

          {order.garments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2">
                {order.garments.length} vêtement{order.garments.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                {order.garments.map((g) => (
                  <div key={g.id} className="text-sm text-slate-600">
                    • {g.type} — {g.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {(order.incidents.length > 0 || order.observations) && (
          <div
            className="rounded-2xl p-5 mb-5"
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B45309' }}>
              Informations importantes
            </p>
            <div className="space-y-3">
              {order.observations && (
                <p className="text-sm" style={{ color: '#92400E' }}>
                  {order.observations}
                </p>
              )}
              {order.incidents.map((inc, idx) => (
                <div
                  key={inc.id}
                  className={idx < order.incidents.length - 1 ? 'pb-3' : ''}
                  style={idx < order.incidents.length - 1 ? { borderBottom: '1px solid #FED7AA' } : undefined}
                >
                  <p className="text-sm" style={{ color: '#92400E' }}>
                    {inc.message}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: '#B45309', opacity: 0.75 }}>
                    {formatDateTime(inc.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #C81E6E, #87CEEB)' }} />
            <h2 className="font-semibold text-sm" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}>
              Paiement
            </h2>
          </div>
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Total</span>
              <span className="text-slate-700 font-medium">{order.totalPrice.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payé</span>
              <span className="text-slate-700">{order.paidAmount.toLocaleString()} FCFA</span>
            </div>
          </div>
          <div
            className="rounded-xl p-3 flex justify-between items-center"
            style={{
              background: order.remainingAmount > 0 ? '#FFF7ED' : '#F0FDF4',
            }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: order.remainingAmount > 0 ? '#B45309' : '#15803D' }}
            >
              {order.remainingAmount > 0 ? 'Restant à payer' : 'Entièrement payé'}
            </span>
            <span
              className="text-base font-bold"
              style={{ color: order.remainingAmount > 0 ? '#B45309' : '#15803D' }}
            >
              {order.remainingAmount.toLocaleString()} FCFA
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Pour toute question, contactez directement votre pressing.
        </p>
      </div>
    </div>
  );
}
