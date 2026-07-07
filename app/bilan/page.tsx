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

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{
        background: positive ? '#DCFCE7' : '#FEE2E2',
        color: positive ? '#15803D' : '#DC2626',
      }}
    >
      {positive ? '↗' : '↘'} {Math.abs(value)}%
    </span>
  );
}

function BilanRow({
  title,
  current,
  previousLabel,
  previous,
  change,
}: {
  title: string;
  current: { count: number; revenue: number; remaining: number };
  previousLabel: string;
  previous: { count: number; revenue: number; remaining: number };
  change: number | null;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3
          className="font-semibold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
        >
          {title}
        </h3>
        <ChangeBadge value={change} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">{title}</p>
          <p className="text-xl font-bold" style={{ color: '#1A1A2E' }}>
            {current.revenue.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {current.count} commande{current.count > 1 ? 's' : ''}
          </p>
          {current.remaining > 0 && (
            <p className="text-xs mt-1" style={{ color: '#EA580C' }}>
              {current.remaining.toLocaleString()} FCFA restants
            </p>
          )}
        </div>
        <div style={{ borderLeft: '1px solid #F1F5F9', paddingLeft: '1rem' }}>
          <p className="text-xs text-slate-400 mb-1">{previousLabel}</p>
          <p className="text-xl font-bold text-slate-400">
            {previous.revenue.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {previous.count} commande{previous.count > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BilanPage() {
  const router = useRouter();
  const [data, setData] = useState<BilanData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
        <div className="bg-white rounded-2xl p-6 text-center max-w-sm" style={{ boxShadow: '0 4px 20px -6px rgba(26,26,46,0.08)' }}>
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

        <div className="space-y-4">
          <BilanRow
            title="Aujourd&apos;hui"
            current={data.today}
            previousLabel="Hier"
            previous={data.yesterday}
            change={data.today.changeVsPrevious}
          />
          <BilanRow
            title="Cette semaine"
            current={data.week}
            previousLabel="Semaine précédente"
            previous={data.prevWeek}
            change={data.week.changeVsPrevious}
          />
          <BilanRow
            title="Ce mois"
            current={data.month}
            previousLabel="Mois précédent"
            previous={data.prevMonth}
            change={data.month.changeVsPrevious}
          />
          <BilanRow
            title="Cette année"
            current={data.year}
            previousLabel="Année précédente"
            previous={data.prevYear}
            change={data.year.changeVsPrevious}
          />
        </div>
      </div>
    </div>
  );
}
