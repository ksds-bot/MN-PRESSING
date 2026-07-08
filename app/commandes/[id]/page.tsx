'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Garment {
  id: string;
  type: string;
  description: string;
  observations: string | null;
}

interface Photo {
  id: string;
  url: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  receiptNumber: string;
  status: string;
  depositDate: string;
  expectedReturnDate: string;
  deliveryDate: string | null;
  observations: string | null;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  customer: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
  };
  garments: Garment[];
  photos: Photo[];
  payments: Payment[];
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Reçu',
  WASHING: 'En lavage',
  IRONING: 'En repassage',
  READY: 'Prêt',
  DELIVERED: 'Livré',
};

const STATUS_ORDER = ['RECEIVED', 'WASHING', 'IRONING', 'READY', 'DELIVERED'];

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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CommandeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchOrder = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userStr) {
      setIsAdmin(JSON.parse(userStr).role === 'ADMIN');
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Commande introuvable');
        setLoading(false);
        return;
      }

      setOrder(data.order);
      setLoading(false);
    } catch (err) {
      setError('Erreur serveur');
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      alert('Erreur serveur');
    } finally {
      setUpdating(false);
    }
  }

  async function addPayment() {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;

    setUpdating(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paidAmount: amount }),
      });
      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
        setPaymentAmount('');
        setShowPaymentInput(false);
      } else {
        alert(data.error || "Erreur lors de l'ajout du paiement");
      }
    } catch (err) {
      alert('Erreur serveur');
    } finally {
      setUpdating(false);
    }
  }

  function sendWhatsApp() {
    if (!order) return;
    const phone = order.customer.phoneNumber.replace(/[^0-9]/g, '');
    const message = `Bonjour ${order.customer.fullName}, votre/vos vêtement(s) sont prêts chez MN Pressing. Vous pouvez passer les récupérer. Merci pour votre confiance.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

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

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={bgStyle}>
        <div
          className="bg-white rounded-2xl p-6 text-center max-w-sm"
          style={{ boxShadow: '0 4px 20px -6px rgba(26,26,46,0.08)' }}
        >
          <p className="text-red-600 mb-4 text-sm">{error || 'Commande introuvable'}</p>
          <button
            onClick={() => router.push('/commandes')}
            className="text-white px-5 py-2.5 rounded-xl font-medium text-sm"
            style={{ background: '#C81E6E' }}
          >
            Retour aux commandes
          </button>
        </div>
      </div>
    );
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status);

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
          onClick={() => router.push('/commandes')}
          className="text-sm text-slate-500 mb-4 flex items-center gap-1"
        >
          ← Retour
        </button>

        {/* En-tête commande */}
        <div
          className="bg-white rounded-2xl p-5 mb-4"
          style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1
                className="text-xl font-bold cursor-pointer"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
                onClick={() => router.push(`/clients/${order.customer.id}`)}
              >
                {order.customer.fullName}
              </h1>
              <p
                className="text-xs font-medium cursor-pointer"
                style={{ color: '#C81E6E' }}
                onClick={() => router.push(`/clients/${order.customer.id}`)}
              >
                Voir l&apos;historique →
              </p>
              <p className="text-sm text-slate-400 mt-1">{order.customer.phoneNumber}</p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: STATUS_COLORS[order.status]?.bg,
                color: STATUS_COLORS[order.status]?.text,
              }}
            >
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Reçu n° {order.receiptNumber.slice(0, 12)} · Déposé le {formatDate(order.depositDate)} ·
            Retrait prévu le {formatDate(order.expectedReturnDate)}
          </p>
          {order.observations && (
            <p className="text-sm text-slate-600 mt-2 italic">« {order.observations} »</p>
          )}
        </div>

        {/* Bouton WhatsApp si Prêt */}
        {order.status === 'READY' && (
          <button
            onClick={sendWhatsApp}
            className="w-full mb-4 flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl"
            style={{ background: '#25D366', boxShadow: '0 8px 20px -6px rgba(37, 211, 102, 0.5)' }}
          >
            📱 Envoyer sur WhatsApp
          </button>
        )}

        {/* Changement de statut (admin uniquement) */}
        {isAdmin && (
          <div
            className="bg-white rounded-2xl p-5 mb-4"
            style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
              Changer le statut
            </h2>
            <div className="flex gap-2 flex-wrap">
              {STATUS_ORDER.map((s, i) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updating}
                  className="text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    background: i === currentStatusIndex ? '#1A1A2E' : STATUS_COLORS[s].bg,
                    color: i === currentStatusIndex ? '#FFFFFF' : STATUS_COLORS[s].text,
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vêtements */}
        <div
          className="bg-white rounded-2xl p-5 mb-4"
          style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Vêtements ({order.garments.length})
          </h2>
          <div className="space-y-3">
            {order.garments.map((g) => (
              <div key={g.id} className="rounded-xl p-3" style={{ background: '#FAFAFA' }}>
                <p className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>
                  {g.type}
                </p>
                <p className="text-sm text-slate-500">{g.description}</p>
                {g.observations && (
                  <p className="text-xs text-slate-400 italic mt-1">{g.observations}</p>
                )}
              </div>
            ))}
          </div>

          {order.photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4">
              {order.photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.url}
                  alt="vêtement"
                  className="w-20 h-20 object-cover rounded-lg"
                  style={{ border: '1px solid #F1F5F9' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Financier */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Paiement
          </h2>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Prix total</span>
            <span className="font-semibold" style={{ color: '#1A1A2E' }}>
              {order.totalPrice.toLocaleString()} FCFA
            </span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Payé</span>
            <span className="font-semibold text-green-600">
              {order.paidAmount.toLocaleString()} FCFA
            </span>
          </div>
          <div
            className="flex justify-between text-sm pt-2 mb-3"
            style={{ borderTop: '1px solid #F1F5F9' }}
          >
            <span className="font-semibold text-slate-600">Reste à payer</span>
            <span className="font-bold" style={{ color: '#C81E6E' }}>
              {order.remainingAmount.toLocaleString()} FCFA
            </span>
          </div>

          {order.remainingAmount > 0 && (
            <>
              {showPaymentInput ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Montant"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  />
                  <button
                    onClick={addPayment}
                    disabled={updating}
                    className="text-sm font-medium px-4 py-2 rounded-xl text-white disabled:opacity-50"
                    style={{ background: '#C81E6E' }}
                  >
                    Valider
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPaymentInput(true)}
                  className="w-full text-sm font-medium py-2.5 rounded-xl"
                  style={{ background: '#FDF2F8', color: '#C81E6E' }}
                >
                  + Enregistrer un paiement
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
