'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PressingBackground from '@/app/components/PressingBackground';

interface LoginEntry {
  id: string;
  loginAt: string;
  ipAddress: string | null;
  user: {
    name: string;
    email: string;
    role: string;
  };
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

export default function ConnexionsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
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
        const res = await fetch('/api/users/login-history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          setHistory(data.history);
        } else {
          setError(data.error || 'Erreur lors du chargement');
        }
      } catch (err) {
        setError('Erreur serveur');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [router]);

  const bgStyle = {
    background: 'linear-gradient(160deg, #FDF2F8 0%, #FFFFFF 40%, #E0F2FE 100%)',
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={bgStyle}>
      <PressingBackground />

      <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        <button
          onClick={() => router.push('/utilisateurs')}
          className="text-sm text-slate-500 mb-4 flex items-center gap-1 hover:text-slate-700 transition-colors animate-fade-up"
        >
          ← Utilisateurs
        </button>

        <div className="mb-6 animate-fade-up" style={{ animationDelay: '40ms' }}>
          <h1 className="text-2xl font-bold tracking-tight font-display" style={{ color: '#1A1A2E' }}>
            Historique des <span className="text-gradient-pressing">connexions</span>
          </h1>
          <p className="text-xs text-slate-400 italic">Suivi des accès à la plateforme</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="washing-machine animate-spin-slow" style={{ width: 60, height: 60 }}>
              <div className="drum" />
              <div className="clothes animate-spin-slower" />
            </div>
            <p className="text-center text-slate-400 text-sm">Chargement...</p>
          </div>
        ) : error ? (
          <p className="text-center text-red-500 text-sm py-8">{error}</p>
        ) : history.length === 0 ? (
          <div
            className="glass-card rounded-2xl p-8 text-center shadow-premium-sm animate-fade-up"
            style={{ animationDelay: '90ms' }}
          >
            <p className="text-slate-400 text-sm italic">Aucune connexion enregistrée.</p>
          </div>
        ) : (
          <div
            className="glass-card rounded-2xl overflow-hidden shadow-premium-sm animate-fade-up"
            style={{ animationDelay: '90ms' }}
          >
            {history.map((entry, i) => (
              <div
                key={entry.id}
                className="flex justify-between items-center px-4 py-3 hover:bg-white/60 transition-colors"
                style={{
                  borderBottom: i < history.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>
                    {entry.user.name}
                  </p>
                  <p className="text-xs text-slate-400">{entry.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium" style={{ color: '#1A1A2E' }}>
                    {formatDateTime(entry.loginAt)}
                  </p>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1"
                    style={{
                      background: entry.user.role === 'ADMIN' ? '#FCE7F3' : '#E0F2FE',
                      color: entry.user.role === 'ADMIN' ? '#C81E6E' : '#0369A1',
                    }}
                  >
                    {entry.user.role === 'ADMIN' ? 'Admin' : 'Employé'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
