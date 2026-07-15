'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PressingBackground from '@/app/components/PressingBackground';

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

interface Incident {
  id: string;
  message: string;
  createdAt: string;
  reportedBy: { id: string; name: string } | null;
}

interface OrderDetail {
  id: string;
  receiptNumber: string;
  status: string;
  createdAt: string;
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
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentMessage, setIncidentMessage] = useState('');
  const [showIncidentInput, setShowIncidentInput] = useState(false);
  const [postingIncident, setPostingIncident] = useState(false);

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

      const incidentsRes = await fetch(`/api/orders/${orderId}/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const incidentsData = await incidentsRes.json();
      if (incidentsData.success) {
        setIncidents(incidentsData.incidents);
      }
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

  async function addIncident() {
    const message = incidentMessage.trim();
    if (!message) return;

    setPostingIncident(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`/api/orders/${orderId}/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      if (data.success) {
        setIncidents((prev) => [data.incident, ...prev]);
        setIncidentMessage('');
        setShowIncidentInput(false);
      } else {
        alert(data.error || "Erreur lors de l'ajout de l'incident");
      }
    } catch (err) {
      alert('Erreur serveur');
    } finally {
      setPostingIncident(false);
    }
  }

  async function deleteIncident(incidentId: string) {
    if (!confirm('Supprimer cette observation ?')) return;
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`/api/orders/${orderId}/incidents?incidentId=${incidentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setIncidents((prev) => prev.filter((i) => i.id !== incidentId));
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      alert('Erreur serveur');
    }
  }

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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={bgStyle}>
        <PressingBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="washing-machine animate-spin-slow">
            <div className="drum" />
            <div className="clothes animate-spin-slower" />
          </div>
          <p className="text-slate-400 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={bgStyle}>
        <PressingBackground />
        <div
          className="glass-card rounded-2xl p-6 text-center max-w-sm relative z-10 animate-scale-in"
          style={{ boxShadow: '0 4px 20px -6px rgba(26,26,46,0.08)' }}
        >
          <p className="text-red-600 mb-4 text-sm">{error || 'Commande introuvable'}</p>
          <button
            onClick={() => router.push('/commandes')}
            className="text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-transform hover:-translate-y-0.5"
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
      <PressingBackground />

      <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        <button
          onClick={() => router.push('/commandes')}
          className="text-sm text-slate-500 mb-4 flex items-center gap-1 hover:text-slate-700 transition-colors animate-fade-up"
        >
          ← Retour
        </button>

        {/* En-tête commande */}
        <div
          className="glass-card rounded-2xl p-5 mb-4 shadow-premium-sm animate-fade-up"
          style={{ animationDelay: '40ms' }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1
                className="text-xl font-bold cursor-pointer font-display hover:text-pressing-rose transition-colors"
                style={{ color: '#1A1A2E' }}
                onClick={() => router.push(`/clients/${order.customer.id}`)}
              >
                {order.customer.fullName}
              </h1>
              <p
                className="text-xs font-medium cursor-pointer hover:underline"
                style={{ color: '#C81E6E' }}
                onClick={() => router.push(`/clients/${order.customer.id}`)}
              >
                Voir l&apos;historique →
              </p>
              <p className="text-sm text-slate-400 mt-1">{order.customer.phoneNumber}</p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap"
              style={{
                background: STATUS_COLORS[order.status]?.bg,
                color: STATUS_COLORS[order.status]?.text,
              }}
            >
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Reçu n° {order.receiptNumber.slice(0, 12)} · Enregistrée le{' '}
            {formatDateTime(order.createdAt)} · Retrait prévu le {formatDate(order.expectedReturnDate)}
          </p>

          <button
            onClick={() => {
              const link = `${window.location.origin}/suivi/${order.receiptNumber}`;
              navigator.clipboard.writeText(link);
              alert('Lien de suivi copié ! Vous pouvez le transmettre au client.');
            }}
            className="text-xs font-medium mt-2 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-transform hover:-translate-y-0.5"
            style={{ background: '#E0F2FE', color: '#0369A1' }}
          >
            Copier le lien de suivi client
          </button>

          {order.observations && (
            <p className="text-sm text-slate-600 mt-2 italic">« {order.observations} »</p>
          )}
        </div>

        {/* Bouton WhatsApp si Prêt */}
        {order.status === 'READY' && (
          <button
            onClick={sendWhatsApp}
            className="btn-shimmer w-full mb-4 flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition-transform hover:-translate-y-0.5 animate-fade-up"
            style={{ background: '#25D366', boxShadow: '0 8px 20px -6px rgba(37, 211, 102, 0.5)' }}
          >
            📱 Envoyer sur WhatsApp
          </button>
        )}

        {/* Changement de statut (admin uniquement) */}
        {isAdmin && (
          <div
            className="glass-card rounded-2xl p-5 mb-4 shadow-premium-sm animate-fade-up"
            style={{ animationDelay: '90ms' }}
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
                  className="text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50 hover:-translate-y-0.5"
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
          className="glass-card rounded-2xl p-5 mb-4 shadow-premium-sm animate-fade-up"
          style={{ animationDelay: '140ms' }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Vêtements ({order.garments.length})
          </h2>
          <div className="space-y-3">
            {order.garments.map((g) => (
              <div key={g.id} className="rounded-xl p-3 transition-transform hover:-translate-y-0.5" style={{ background: '#FAFAFA' }}>
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
                  className="w-20 h-20 object-cover rounded-lg transition-transform hover:scale-105"
                  style={{ border: '1px solid #F1F5F9' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Incidents / observations visibles par le client */}
        <div
          className="glass-card rounded-2xl p-5 mb-4 shadow-premium-sm animate-fade-up"
          style={{ animationDelay: '190ms' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Observations client (visibles sur le lien de suivi)
            </h2>
          </div>

          {incidents.length > 0 && (
            <div className="space-y-2 mb-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="rounded-xl p-3 flex justify-between items-start gap-2 animate-fade-up"
                  style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}
                >
                  <div>
                    <p className="text-sm" style={{ color: '#92400E' }}>
                      {inc.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {formatDateTime(inc.createdAt)}
                      {inc.reportedBy ? ` · ${inc.reportedBy.name}` : ''}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => deleteIncident(inc.id)}
                      className="text-xs text-slate-400 hover:text-red-500 shrink-0"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {showIncidentInput ? (
            <div className="space-y-2 animate-fade-in">
              <textarea
                placeholder="Ex : Panne de la machine à laver, retard prévu de 24h..."
                value={incidentMessage}
                onChange={(e) => setIncidentMessage(e.target.value)}
                maxLength={500}
                rows={3}
                className="input-premium w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={addIncident}
                  disabled={postingIncident || !incidentMessage.trim()}
                  className="text-sm font-medium px-4 py-2 rounded-xl text-white disabled:opacity-50 transition-transform hover:-translate-y-0.5"
                  style={{ background: '#C81E6E' }}
                >
                  Publier
                </button>
                <button
                  onClick={() => {
                    setShowIncidentInput(false);
                    setIncidentMessage('');
                  }}
                  className="text-sm font-medium px-4 py-2 rounded-xl text-slate-500"
                  style={{ background: '#F1F5F9' }}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowIncidentInput(true)}
              className="w-full text-sm font-medium py-2.5 rounded-xl transition-transform hover:-translate-y-0.5"
              style={{ background: '#FFF7ED', color: '#B45309' }}
            >
              + Signaler un incident / une observation
            </button>
          )}
        </div>

        {/* Financier */}
        <div
          className="glass-card rounded-2xl p-5 shadow-premium-sm animate-fade-up"
          style={{ animationDelay: '240ms' }}
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
                <div className="flex gap-2 animate-fade-in">
                  <input
                    type="number"
                    placeholder="Montant"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="input-premium flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  />
                  <button
                    onClick={addPayment}
                    disabled={updating}
                    className="text-sm font-medium px-4 py-2 rounded-xl text-white disabled:opacity-50 transition-transform hover:-translate-y-0.5"
                    style={{ background: '#C81E6E' }}
                  >
                    Valider
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPaymentInput(true)}
                  className="w-full text-sm font-medium py-2.5 rounded-xl transition-transform hover:-translate-y-0.5"
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
