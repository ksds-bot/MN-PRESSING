'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExportOrder {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerPhone: string;
  depositDate: string;
  expectedReturnDate: string;
  deliveryDate: string | null;
  status: string;
  garmentsCount: number;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  observations: string | null;
}

interface Totals {
  garmentsCount: number;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
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

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function toCsv(rows: ExportOrder[]): string {
  const headers = [
    'N° Reçu',
    'Client',
    'Téléphone',
    'Date dépôt',
    'Date prévue',
    'Date livraison',
    'Statut',
    'Nb vêtements',
    'Total (FCFA)',
    'Payé (FCFA)',
    'Restant (FCFA)',
    'Observations',
  ];

  const escape = (v: string | number | null) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (s.includes(';') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = rows.map((r) =>
    [
      r.receiptNumber,
      r.customerName,
      r.customerPhone,
      formatDate(r.depositDate),
      formatDate(r.expectedReturnDate),
      formatDate(r.deliveryDate),
      STATUS_LABELS[r.status] || r.status,
      r.garmentsCount,
      r.totalPrice,
      r.paidAmount,
      r.remainingAmount,
      r.observations || '',
    ]
      .map(escape)
      .join(';')
  );

  return [headers.map(escape).join(';'), ...lines].join('\n');
}

export default function ExportPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<ExportOrder[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchExport() {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN') {
        router.push('/commandes/nouvelle');
        return;
      }

      try {
        const res = await fetch('/api/orders/export', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        if (!result.success) {
          setError(result.error || "Erreur lors du chargement de l'export");
          setLoading(false);
          return;
        }

        setOrders(result.orders);
        setTotals(result.totals);
        setLoading(false);
      } catch (err) {
        setError('Erreur serveur, réessayez.');
        setLoading(false);
      }
    }

    fetchExport();
  }, [router]);

  function handleDownloadCsv() {
    const csv = toCsv(orders);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `export-commandes-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleDownloadPdf() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch('/api/orders/export/pdf', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Erreur lors de la génération du PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `export-commandes-${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur serveur, réessayez.');
    }
  }

  const bgStyle = {
    background: 'linear-gradient(160deg, #FDF2F8 0%, #FFFFFF 40%, #E0F2FE 100%)',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <p className="text-slate-400 text-sm">Chargement de l&apos;export...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={bgStyle}>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-sm">
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white px-5 py-2.5 rounded-xl font-medium text-sm"
            style={{ background: '#C81E6E' }}
          >
            Retour au tableau de bord
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

      <div className="max-w-6xl mx-auto px-4 py-6 relative">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
            >
              Export <span style={{ color: '#C81E6E' }}>commandes</span>
            </h1>
            <p className="text-xs text-slate-400 italic">
              Commandes déposées il y a plus de 7 jours
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-medium px-4 py-2.5 rounded-xl bg-white text-slate-600"
              style={{ boxShadow: '0 4px 12px -4px rgba(26,26,46,0.1)' }}
            >
              Tableau de bord
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={orders.length === 0}
              className="text-sm font-medium px-4 py-2.5 rounded-xl bg-white text-slate-600 disabled:opacity-50"
              style={{ boxShadow: '0 4px 12px -4px rgba(26,26,46,0.1)' }}
            >
              Télécharger PDF
            </button>
            <button
              onClick={handleDownloadCsv}
              disabled={orders.length === 0}
              className="text-sm font-medium px-4 py-2.5 rounded-xl text-white disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
                boxShadow: '0 8px 20px -8px rgba(200, 30, 110, 0.5)',
              }}
            >
              Télécharger CSV
            </button>
          </div>
        </div>

        {totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl p-5 bg-white" style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-slate-400">Commandes</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}>
                {orders.length}
              </p>
            </div>
            <div className="rounded-2xl p-5 bg-white" style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-slate-400">Vêtements</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}>
                {totals.garmentsCount}
              </p>
            </div>
            <div className="rounded-2xl p-5 bg-white" style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-slate-400">Encaissé</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}>
                {totals.paidAmount.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
              </p>
            </div>
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
                boxShadow: '0 12px 28px -8px rgba(200, 30, 110, 0.45)',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Restant
              </p>
              <p className="text-2xl font-bold text-white">
                {totals.remainingAmount.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}>
          {orders.length === 0 ? (
            <p className="text-slate-400 text-sm italic text-center py-10">
              Aucune commande de plus de 7 jours à exporter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">N° Reçu</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">Client</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">Dépôt</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">Prévue</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">Statut</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">Vêt.</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">Total</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">Payé</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">Restant</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const statusStyle = STATUS_COLORS[o.status] || { bg: '#F1F5F9', text: '#475569' };
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                        onClick={() => router.push(`/commandes/${o.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{o.receiptNumber}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {o.customerName}
                          <span className="block text-xs text-slate-400">{o.customerPhone}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(o.depositDate)}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(o.expectedReturnDate)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: statusStyle.bg, color: statusStyle.text }}
                          >
                            {STATUS_LABELS[o.status] || o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{o.garmentsCount}</td>
                        <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                          {o.totalPrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                          {o.paidAmount.toLocaleString()}
                        </td>
                        <td
                          className="px-4 py-3 text-right font-medium whitespace-nowrap"
                          style={{ color: o.remainingAmount > 0 ? '#EA580C' : '#15803D' }}
                        >
                          {o.remainingAmount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
