'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PressingBackground from '@/app/components/PressingBackground';

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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={bgStyle}>
        <PressingBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="washing-machine animate-spin-slow">
            <div className="drum" />
            <div className="clothes animate-spin-slower" />
          </div>
          <p className="text-slate-400 text-sm">Chargement de votre commande...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={bgStyle}>
        <PressingBackground />
        <div className="glass-card rounded-2xl shadow-premium p-8 text-center max-w-sm relative z-10 animate-scale-in">
          <p className="text-lg font-bold mb-2 font-display" style={{ color: '#1A1A2E' }}>
            MN <span className="text-gradient-pressing">Pressing</span>
          </p>
          <p className="text-red-600 text-sm">{error || 'Commande introuvable'}</p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="min-h-screen relative overflow-hidden" style={bgStyle}>
      <PressingBackground />

      <div className="max-w-lg mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-6 animate-fade-up">
          <div className="flex justify-center mb-3">
            <div className="relative w-14 h-14">
              <div
                className="absolute inset-0 rounded-full animate-spin-slow"
                style={{
                  background: 'conic-gradient(from 0deg, #C81E6E, #87CEEB, #F9A8D4, #C81E6E)',
                  opacity: 0.9,
                }}
              />
              <div className="absolute inset-1.5 rounded-full bg-white flex items-center justify-center shadow-inner">
                <span className="text-xl">✨</span>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 font-display" style={{ color: '#1A1A2E' }}>
            MN <span className="text-gradient-pressing">Pressing</span>
          </h1>
          <p className="text-xs text-slate-400">Suivi de commande</p>
        </div>

        <div
          className="rounded-2xl p-6 mb-5 text-center relative overflow-hidden animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
            boxShadow: '0 12px 28px -8px rgba(200, 30, 110, 0.45)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 animate-pulse-glow" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          <p className="text-xs uppercase tracking-wide mb-2 relative" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {order.receiptNumber}
          </p>
          <p className="text-2xl font-bold text-white mb-2 font-display relative">
            {STATUS_LABELS[order.status] || order.status}
          </p>
          <p className="text-sm relative" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {STATUS_DESCRIPTIONS[order.status]}
          </p>
        </div>

        <div
          className="glass-card rounded-2xl p-5 mb-5 shadow-premium-sm animate-fade-up"
          style={{ animationDelay: '90ms' }}
        >
          <div className="flex items-center justify-between">
            {STATUS_ORDER.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div
                    className="absolute top-3 right-1/2 w-full h-0.5 transition-all duration-700"
                    style={{ background: i <= currentIndex ? '#C81E6E' : '#E2E8F0', zIndex: 0 }}
                  />
                )}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center relative z-10 text-xs font-bold transition-all duration-500"
                  style={{
                    background: i <= currentIndex ? '#C81E6E' : '#E2E8F0',
                    color: i <= currentIndex ? '#fff' : '#94A3B8',
                    boxShadow: i === currentIndex ? '0 0 0 4px rgba(200,30,110,0.2)' : 'none',
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

        <div
          className="glass-card rounded-2xl p-6 mb-5 shadow-premium-sm animate-fade-up"
          style={{ animationDelay: '140ms' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #C81E6E, #87CEEB)' }} />
            <h2 className="font-semibold text-sm font-display" style={{ color: '#1A1A2E' }}>
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
            className="rounded-2xl p-5 mb-5 animate-fade-up"
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA', animationDelay: '190ms' }}
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

        <div
          className="glass-card rounded-2xl p-6 shadow-premium-sm animate-fade-up"
          style={{ animationDelay: '240ms' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #C81E6E, #87CEEB)' }} />
            <h2 className="font-semibold text-sm font-display" style={{ color: '#1A1A2E' }}>
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

        <p className="text-center text-xs text-slate-400 mt-6 animate-fade-in">
          Pour toute question, contactez directement votre pressing.
        </p>
      </div>
    </div>
  );
}
