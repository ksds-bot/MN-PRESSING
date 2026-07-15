'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PressingBackground from '../components/PressingBackground';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Erreur lors de la création du compte');
        setLoading(false);
        return;
      }

      router.push('/login');
    } catch (err) {
      setError('Erreur serveur, réessayez.');
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-10"
      style={{
        background: 'linear-gradient(160deg, #E0F2FE 0%, #FFFFFF 45%, #FDF2F8 100%)',
      }}
    >
      <PressingBackground />

      <div className="w-full max-w-sm relative z-10 animate-fade-up">
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <div
              className="absolute inset-0 rounded-full animate-spin-slow"
              style={{
                background: 'conic-gradient(from 0deg, #87CEEB, #C81E6E, #F9A8D4, #87CEEB)',
                opacity: 0.9,
              }}
            />
            <div className="absolute inset-1.5 rounded-full bg-white flex items-center justify-center shadow-inner">
              <span className="text-2xl">🧺</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 relative shadow-premium animate-scale-in">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-1.5 rounded-full"
            style={{ background: 'linear-gradient(90deg, #87CEEB, #C81E6E)' }}
          />

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-1 tracking-tight font-display" style={{ color: '#1A1A2E' }}>
              MN <span className="text-gradient-pressing">Pressing</span>
            </h1>
            <p className="text-xs italic text-slate-400 tracking-wide">Créer un compte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Nom complet
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="input-premium w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
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
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className="input-premium w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none"
                placeholder="••••••••"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
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
                background: 'linear-gradient(135deg, #3AA0D6 0%, #C81E6E 100%)',
                boxShadow: '0 8px 20px -6px rgba(58, 160, 214, 0.5)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Création...
                </span>
              ) : (
                'Créer le compte'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            Déjà un compte ?{' '}
            <a href="/login" className="text-pressing-rose font-semibold hover:underline">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
