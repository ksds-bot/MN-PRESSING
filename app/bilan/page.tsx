'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StatWithChange {
  count: number;
  revenue: number;
  remaining: number;
  changeVsPrevious: number | null;
}

interface BilanData {
  today: StatWithChange;
  yesterday: { count: number; revenue: number; remaining: number };
  week: StatWithChange;
  prevWeek: { count: number; revenue: number; remaining: number };
  month: StatWithChange;
  prevMonth: { count: number; revenue: number; remaining: number };
  year: StatWithChange;
  prevYear: { count: number; revenue: number; remaining: number };
}

type TabKey = 'today' | 'week' | 'month' | 'year';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' },
];

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-full"
      style={{
        background: positive ? '#DCFCE7' : '#FEE2E2',
        color: positive ? '#15803D' : '#DC2626',
      }}
    >
      {positive ? '↗' : '↘'} {Math.abs(value)}%
    </span>
  );
}

export default function BilanPage() {
  const router = useRouter();
  const [data, setData] = useState<BilanData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('today');

  useEffect(() => {
    async function fetchBilan() {
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
        const res = await fetch('/api/dashboard/bilan', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        if (!result.success) {
          setError(result.error || 'Erreur lors du chargement du bilan');
          setLoading(false);
          return;
        }

        setData(result);
        setLoading(false);
      } catch (err) {
        setError('Erreur serveur, réessayez.');
        setLoading(false);
      }
    }

    fetchBilan();
  }, [router]);

  const bgStyle = {
    background: 'linear-gradient(160deg, #FDF2F8 0%, #FFFFFF 40%, #E0F2FE 100%)',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <p className="text-slate-400 text-sm">Chargement du bilan...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={bgStyle}>
        <div
          className="bg-white rounded-2xl p-6 text-center max-w-sm"
          style={{ boxShadow: '0 4px 20px -6px rgba(26,26,46,0.08)' }}
        >
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

  const contentByTab: Record<
    TabKey,
    {
      current: { count: number; revenue: number; remaining: number };
      previousLabel: string;
      previous: { count: number; revenue: number; remaining: number };
      change: number | null;
      currentLabel: string;
    }
  > = {
    today: {
      current: data.today,
      currentLabel: "Aujourd'hui",
      previousLabel: 'Hier',
      previous: data.yesterday,
      change: data.today.changeVsPrevious,
    },
    week: {
      current: data.week,
      currentLabel: 'Cette semaine',
      previousLabel: 'Semaine précédente',
      previous: data.prevWeek,
      change: data.week.changeVsPrevious,
    },
    month: {
      current: data.month,
      currentLabel: 'Ce mois',
      previousLabel: 'Mois précédent',
      previous: data.prevMonth,
      change: data.month.changeVsPrevious,
    },
    year: {
      current: data.year,
      currentLabel: 'Cette année',
      previousLabel: 'Année précédente',
      previous: data.prevYear,
      change: data.year.changeVsPrevious,
    },
  };

  const active = contentByTab[activeTab];

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
          onClick={() => router.push('/dashboard')}
          className="text-sm text-slate-500 mb-4 flex items-center gap-1"
        >
          ← Tableau de bord
        </button>

        <div className="mb-6">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
          >
            Bilan <span style={{ color: '#C81E6E' }}>financier</span>
          </h1>
          <p className="text-xs text-slate-400 italic">Comparaisons par période</p>
        </div>

        {/* Onglets */}
        <div
          className="flex gap-1 mb-5 p-1 rounded-2xl bg-white"
          style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 text-sm font-medium py-2.5 rounded-xl transition-all"
              style={{
                background: activeTab === tab.key ? '#C81E6E' : 'transparent',
                color: activeTab === tab.key ? '#FFFFFF' : '#64748B',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu de l'onglet actif */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
        >
          <div className="flex justify-between items-center mb-5">
            <h2
              className="font-semibold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
            >
              {active.currentLabel}
            </h2>
            <ChangeBadge value={active.change} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">{active.currentLabel}</p>
              <p className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>
                {active.current.revenue.toLocaleString()}{' '}
                <span className="text-xs font-normal">FCFA</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {active.current.count} commande{active.current.count > 1 ? 's' : ''}
              </p>
              {active.current.remaining > 0 && (
                <p className="text-xs mt-2 font-medium" style={{ color: '#EA580C' }}>
                  {active.current.remaining.toLocaleString()} FCFA restants
                </p>
              )}
            </div>
            <div style={{ borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
              <p className="text-xs text-slate-400 mb-1">{active.previousLabel}</p>
              <p className="text-2xl font-bold text-slate-400">
                {active.previous.revenue.toLocaleString()}{' '}
                <span className="text-xs font-normal">FCFA</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {active.previous.count} commande{active.previous.count > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
