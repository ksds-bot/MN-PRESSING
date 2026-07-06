'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

function StatCard({
  title,
  count,
  revenue,
  remaining,
}: {
  title: string;
  count: number;
  revenue: number;
  remaining?: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-sm text-slate-500 mb-2">{title}</p>
      <p className="text-2xl font-bold text-blue-900">{count}</p>
      <p className="text-xs text-slate-400 mb-1">commande{count > 1 ? 's' : ''}</p>
      <p className="text-lg font-semibold text-slate-800">{revenue.toLocaleString()} FCFA</p>
      <p className="text-xs text-slate-400">encaissés</p>
      {remaining !== undefined && (
        <p className="text-xs text-orange-600 mt-1">
          {remaining.toLocaleString()} FCFA restants
        </p>
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
        router.push('/commandes/nouvelle');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-xl shadow p-6 text-center max-w-sm">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-900 text-white px-4 py-2 rounded-lg"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxRevenue = Math.max(...data.last7Days.map((d) => d.revenue), 1);

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-900">Tableau de bord</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/commandes/nouvelle')}
              className="text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded-lg font-medium"
            >
              + Commande
            </button>
            <button
              onClick={handleLogout}
              className="text-sm bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Aujourd'hui"
            count={data.today.count}
            revenue={data.today.revenue}
            remaining={data.today.remaining}
          />
          <StatCard title="Hier" count={data.yesterday.count} revenue={data.yesterday.revenue} />
          <StatCard title="Cette semaine" count={data.week.count} revenue={data.week.revenue} />
          <StatCard title="Ce mois" count={data.month.count} revenue={data.month.revenue} />
          <StatCard title="Cette année" count={data.year.count} revenue={data.year.revenue} />
        </div>

        {/* Graphique revenu 7 derniers jours */}
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">Chiffre d'affaires (7 derniers jours)</h2>
          <div className="flex items-end gap-2 h-40">
            {data.last7Days.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-800 rounded-t-md transition-all"
                  style={{
                    height: `${Math.max((day.revenue / maxRevenue) * 100, 2)}%`,
                  }}
                  title={`${day.revenue.toLocaleString()} FCFA`}
                />
                <p className="text-[10px] text-slate-400">
                  {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par statut */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Commandes par statut</h2>
          <div className="space-y-2">
            {data.statusCounts.length === 0 && (
              <p className="text-slate-400 text-sm">Aucune commande enregistrée pour le moment.</p>
            )}
            {data.statusCounts.map((s) => (
              <div key={s.status} className="flex justify-between items-center">
                <span className="text-sm text-slate-700">{STATUS_LABELS[s.status] || s.status}</span>
                <span className="text-sm font-semibold text-blue-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
