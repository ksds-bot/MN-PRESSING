'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Erreur de connexion');
        setLoading(false);
        return;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/commandes/nouvelle');
      }
    } catch (err) {
      setError('Erreur serveur, réessayez.');
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #FDF2F8 0%, #FFFFFF 45%, #E0F2FE 100%)',
      }}
    >
      {/* Ornements en fond, discrets */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-30 blur-3xl"
        style={{ background: '#C81E6E' }}
      />
      <div
        className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full opacity-25 blur-3xl"
        style={{ background: '#87CEEB' }}
      />

      <div className="w-full max-w-sm relative">
        {/* Carte principale */}
        <div
          className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 relative"
          style={{
            boxShadow:
              '0 20px 60px -15px rgba(200, 30, 110, 0.25), 0 8px 24px -8px rgba(26, 26, 46, 0.15)',
          }}
        >
          {/* Liseré décoratif en haut */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-1.5 rounded-full"
            style={{ background: 'linear-gradient(90deg, #C81E6E, #87CEEB)' }}
          />

          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-1 tracking-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#1A1A2E',
              }}
            >
              MN <span style={{ color: '#C81E6E' }}>Pressing</span>
            </h1>
            <p className="text-xs italic text-slate-400 tracking-wide">
              L&apos;élégance commence par un linge parfait
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:bg-white transition-all"
                style={{ outlineColor: '#C81E6E' }}
                onFocus={(e) => (e.target.style.boxShadow = '0 0 0 3px rgba(200, 30, 110, 0.15)')}
                onBlur={(e) => (e.target.style.boxShadow = 'none')}
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:bg-white transition-all"
                onFocus={(e) => (e.target.style.boxShadow = '0 0 0 3px rgba(200, 30, 110, 0.15)')}
                onBlur={(e) => (e.target.style.boxShadow = 'none')}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-2"
              style={{
                background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
                boxShadow: '0 8px 20px -6px rgba(200, 30, 110, 0.5)',
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          MN Pressing — gestion professionnelle
        </p>
      </div>
    </div>
  );
}
