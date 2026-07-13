'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PressingBackground from '../components/PressingBackground';

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
        router.push('/tableau-employe');
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
      <PressingBackground />

      <div className="w-full max-w-sm relative z-10 animate-fade-up">
        {/* Logo / icône pressing animée */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <div
              className="absolute inset-0 rounded-full animate-spin-slow"
              style={{
                background: 'conic-gradient(from 0deg, #C81E6E, #87CEEB, #F9A8D4, #C81E6E)',
                opacity: 0.9,
              }}
            />
            <div className="absolute inset-1.5 rounded-full bg-white flex items-center justify-center shadow-inner">
              <span className="text-2xl">✨</span>
            </div>
          </div>
        </div>

        {/* Carte principale */}
        <div className="glass-card rounded-3xl p-8 relative shadow-premium animate-scale-in">
          {/* Liseré décoratif en haut */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-1.5 rounded-full"
            style={{ background: 'linear-gradient(90deg, #C81E6E, #87CEEB)' }}
          />

          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-1 tracking-tight font-display"
              style={{ color: '#1A1A2E' }}
            >
              MN <span className="text-gradient-pressing">Pressing</span>
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
                className="input-premium w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none"
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
                className="input-premium w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 animate-fade-in">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer w-full text-white font-semibold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 mt-2 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
                boxShadow: '0 8px 20px -6px rgba(200, 30, 110, 0.5)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            Pas encore de compte ?{' '}
            <a href="/register" className="text-pressing-rose font-semibold hover:underline">
              Créer un compte
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          MN Pressing — gestion professionnelle
        </p>
      </div>
    </div>
  );
}
