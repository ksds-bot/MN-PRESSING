'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OverdueAlert from '@/app/components/OverdueAlert';
import PressingBackground from '@/app/components/PressingBackground';

interface PeriodStats {
  count: number;
  revenue: number;
  remaining: number;
  totalValue: number;
}

interface DashboardData {
  today: PeriodStats;
  yesterday: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  year: PeriodStats;
  statusCounts: { status: string; count: number }[];
  last7Days: { date: string; revenue: number; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Reçu',
  WASHING: 'En lavage',
  IRONING: 'En repassage',
  READY: 'Prêt',
  DELIVERED: 'Livré',
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#87CEEB',
  WASHING: '#60A5FA',
  IRONING: '#FBBF24',
  READY: '#C81E6E',
  DELIVERED: '#22C55E',
};

function StatCard({
  title,
  count,
  revenue,
  remaining,
  accent = false,
  delay = 0,
}: {
  title: string;
  count: number;
  revenue: number;
  remaining?: number;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 animate-fade-up"
      style={{
        background: accent
          ? 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)'
          : '#FFFFFF',
        boxShadow: accent
          ? '0 12px 28px -8px rgba(200, 30, 110, 0.45)'
          : '0 4px 20px -6px rgba(26, 26, 46, 0.08)',
        animationDelay: `${delay}ms`,
      }}
    >
      {accent && (
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 animate-pulse-glow" />
      )}
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-2 relative"
        style={{ color: accent ? 'rgba(255,255,255,0.75)' : '#94A3B8' }}
      >
        {title}
      </p>
      <p
        className="text-3xl font-bold mb-0.5 font-display relative"
        style={{ color: accent ? '#FFFFFF' : '#1A1A2E' }}
      >
        {count}
      </p>
      <p
        className="text-xs mb-3 relative"
        style={{ color: accent ? 'rgba(255,255,255,0.65)' : '#94A3B8' }}
      >
        commande{count > 1 ? 's' : ''}
      </p>
      <p
        className="text-lg font-semibold relative"
        style={{ color: accent ? '#FFFFFF' : '#1A1A2E' }}
      >
        {revenue.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
      </p>
      <p
        className="text-xs relative"
        style={{ color: accent ? 'rgba(255,255,255,0.65)' : '#94A3B8' }}
      >
        encaissés
      </p>
      {remaining !== undefined && remaining > 0 && (
        <div
          className="mt-3 pt-3 text-xs font-medium relative"
          style={{
            borderTop: accent
              ? '1px solid rgba(255,255,255,0.25)'
              : '1px solid #F1F5F9',
            color: accent ? '#FFE4F0' : '#EA580C',
          }}
        >
          {remaining.toLocaleString()} FCFA restants
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN') {
        router.push('/tableau-employe');
        return;
      }

      try {
        const res = await fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();

        if (!result.success) {
          setError(result.error || 'Erreur lors du chargement des statistiques');
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

    fetchStats();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
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
          <p className="text-slate-400 text-sm">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={bgStyle}>
        <PressingBackground />
        <div className="glass-card rounded-2xl shadow-premium p-6 text-center max-w-sm relative z-10 animate-scale-in">
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-transform hover:-translate-y-0.5"
            style={{ background: '#C81E6E' }}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxRevenue = Math.max(...data.last7Days.map((d) => d.revenue), 1);
  const totalStatusCount = data.statusCounts.reduce((s, x) => s + x.count, 0) || 1;

  return (
    <div className="min-h-screen relative overflow-hidden" style={bgStyle}>
      <PressingBackground />

      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3 animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display" style={{ color: '#1A1A2E' }}>
              MN <span className="text-gradient-pressing">Pressing</span>
            </h1>
            <p className="text-xs text-slate-400 italic">Tableau de bord</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => router.push('/utilisateurs')}
              className="text-sm font-medium px-4 py-2.5 rounded-xl bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ boxShadow: '0 4px 12px -4px rgba(26,26,46,0.1)' }}
            >
              Utilisateurs
            </button>

            <button
              onClick={() => router.push('/documentation')}
              className="text-sm font-medium px-4 py-2.5 rounded-xl bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ boxShadow: '0 4px 12px -4px rgba(26,26,46,0.1)' }}
            >
              Documentation
            </button>

            <button
              onClick={() => router.push('/bilan')}
              className="text-sm font-medium px-4 py-2.5 rounded-xl bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ boxShadow: '0 4px 12px -4px rgba(26,26,46,0.1)' }}
            >
              Bilan
            </button>

            <button
              onClick={() => router.push('/export')}
              className="text-sm font-medium px-4 py-2.5 rounded-xl bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ boxShadow: '0 4px 12px -4px rgba(26,26,46,0.1)' }}
            >
              Export
            </button>

            <button
              onClick={() => router.push('/commandes')}
              className="text-sm font-medium px-4 py-2.5 rounded-xl bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ boxShadow: '0 4px 12px -4px rgba(26,26,46,0.1)' }}
            >
              Commandes
            </button>

            <button
              onClick={() => router.push('/commandes/nouvelle')}
              className="btn-shimmer text-sm font-medium px-4 py-2.5 rounded-xl text-white transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
                boxShadow: '0 8px 20px -8px rgba(200, 30, 110, 0.5)',
              }}
            >
              + Commande
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-4 py-2.5 rounded-xl bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ boxShadow: '0 4px 12px -4px rgba(26,26,46,0.1)' }}
            >
              Déconnexion
            </button>
          </div>
        </div>

        <OverdueAlert />

        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Aujourd&apos;hui"
            count={data.today.count}
            revenue={data.today.revenue}
            remaining={data.today.remaining}
            accent
            delay={0}
          />
          <StatCard title="Hier" count={data.yesterday.count} revenue={data.yesterday.revenue} delay={60} />
          <StatCard title="Cette semaine" count={data.week.count} revenue={data.week.revenue} delay={120} />
          <StatCard title="Ce mois" count={data.month.count} revenue={data.month.revenue} delay={180} />
          <StatCard title="Cette année" count={data.year.count} revenue={data.year.revenue} delay={240} />
        </div>

        {/* Graphique revenu 7 derniers jours */}
        <div
          className="glass-card rounded-2xl p-6 mb-6 shadow-premium-sm animate-fade-up"
          style={{ animationDelay: '280ms' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-1 h-5 rounded-full"
              style={{ background: 'linear-gradient(180deg, #C81E6E, #87CEEB)' }}
            />
            <h2 className="font-semibold font-display" style={{ color: '#1A1A2E' }}>
              Chiffre d&apos;affaires — 7 derniers jours
            </h2>
          </div>
          <div className="flex items-end gap-2 h-40">
            {data.last7Days.map((day, i) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80 group-hover:scale-x-110"
                  style={{
                    height: `${Math.max((day.revenue / maxRevenue) * 100, 3)}%`,
                    background:
                      i === data.last7Days.length - 1
                        ? 'linear-gradient(180deg, #C81E6E, #A0164F)'
                        : 'linear-gradient(180deg, #87CEEB, #60A5FA)',
                    animation: `fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both`,
                    animationDelay: `${350 + i * 60}ms`,
                  }}
                  title={`${day.revenue.toLocaleString()} FCFA`}
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par statut */}
        <div
          className="glass-card rounded-2xl p-6 shadow-premium-sm animate-fade-up"
          style={{ animationDelay: '380ms' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-1 h-5 rounded-full"
              style={{ background: 'linear-gradient(180deg, #C81E6E, #87CEEB)' }}
            />
            <h2 className="font-semibold font-display" style={{ color: '#1A1A2E' }}>
              Commandes par statut
            </h2>
          </div>

          {data.statusCounts.length === 0 ? (
            <p className="text-slate-400 text-sm italic">
              Aucune commande enregistrée pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {data.statusCounts.map((s, i) => (
                <div key={s.status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-600 font-medium">
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                    <span className="text-sm font-bold" style={{ color: '#1A1A2E' }}>
                      {s.count}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(s.count / totalStatusCount) * 100}%`,
                        background: STATUS_COLORS[s.status] || '#C81E6E',
                        animationDelay: `${420 + i * 80}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
