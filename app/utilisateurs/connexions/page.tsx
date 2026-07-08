'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
          onClick={() => router.push('/utilisateurs')}
          className="text-sm text-slate-500 mb-4 flex items-center gap-1"
        >
          ← Utilisateurs
        </button>

        <div className="mb-6">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
          >
            Historique des <span style={{ color: '#C81E6E' }}>connexions</span>
          </h1>
          <p className="text-xs text-slate-400 italic">Suivi des accès à la plateforme</p>
        </div>

        {loading ? (
          <p className="text-center text-slate-400 text-sm py-8">Chargement...</p>
        ) : error ? (
          <p className="text-center text-red-500 text-sm py-8">{error}</p>
        ) : history.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-8 text-center"
            style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
          >
            <p className="text-slate-400 text-sm italic">Aucune connexion enregistrée.</p>
          </div>
        ) : (
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
          >
            {history.map((entry, i) => (
              <div
                key={entry.id}
                className="flex justify-between items-center px-4 py-3"
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
