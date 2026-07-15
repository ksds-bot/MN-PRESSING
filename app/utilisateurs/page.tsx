'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PressingBackground from '@/app/components/PressingBackground';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { orders: number };
}

const fieldClasses =
  'input-premium w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:bg-white text-sm';

export default function UtilisateursPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const currentUser = JSON.parse(userStr);
    if (currentUser.role !== 'ADMIN') {
      router.push('/commandes/nouvelle');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, confirmPassword, role }),
      });
      const data = await res.json();

      if (!data.success) {
        setFormError(data.error || 'Erreur lors de la création');
        setSubmitting(false);
        return;
      }

      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('EMPLOYEE');
      setShowForm(false);
      setSubmitting(false);
      fetchUsers();
    } catch (err) {
      setFormError('Erreur serveur');
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, userName: string) {
    if (!confirm(`Supprimer le compte de ${userName} ? Cette action est irréversible.`)) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      alert('Erreur serveur');
    }
  }

  const bgStyle = {
    background: 'linear-gradient(160deg, #FDF2F8 0%, #FFFFFF 40%, #E0F2FE 100%)',
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={bgStyle}>
      <PressingBackground />

      <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-slate-500 mb-4 flex items-center gap-1 hover:text-slate-700 transition-colors animate-fade-up"
        >
          ← Tableau de bord
        </button>

        <div className="flex justify-between items-center mb-6 flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '40ms' }}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display" style={{ color: '#1A1A2E' }}>
              Utilisateurs
            </h1>
            <p className="text-xs text-slate-400 italic">Gestion des accès</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/utilisateurs/connexions')}
              className="text-sm font-medium px-4 py-2.5 rounded-xl bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ boxShadow: '0 4px 12px -4px rgba(26,26,46,0.1)' }}
            >
              Connexions
            </button>

            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-shimmer text-sm font-medium px-4 py-2.5 rounded-xl text-white transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
                boxShadow: '0 8px 20px -8px rgba(200, 30, 110, 0.5)',
              }}
            >
              {showForm ? 'Annuler' : '+ Utilisateur'}
            </button>
          </div>
        </div>

        {showForm && (
          <div
            className="glass-card rounded-2xl p-5 mb-5 shadow-premium-sm animate-scale-in"
          >
            <h2 className="font-semibold mb-4 font-display" style={{ color: '#1A1A2E' }}>
              Nouveau compte
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input
                type="text"
                placeholder="Nom complet"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClasses}
              />
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClasses}
              />
              <input
                type="password"
                placeholder="Mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClasses}
              />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClasses}
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'EMPLOYEE' | 'ADMIN')}
                className={fieldClasses}
              >
                <option value="EMPLOYEE">Employé</option>
                <option value="ADMIN">Administrateur</option>
              </select>

              {formError && (
                <p className="text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 animate-fade-in">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-transform hover:-translate-y-0.5"
                style={{ background: '#C81E6E' }}
              >
                {submitting ? 'Création...' : 'Créer le compte'}
              </button>
            </form>
          </div>
        )}

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
        ) : (
          <div className="space-y-3">
            {users.map((u, i) => (
              <div
                key={u.id}
                className="bg-white rounded-2xl p-4 flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow-md animate-fade-up"
                style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)', animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>
                    {u.name}
                  </p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {u._count.orders} commande{u._count.orders > 1 ? 's' : ''} créée
                    {u._count.orders > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: u.role === 'ADMIN' ? '#FCE7F3' : '#E0F2FE',
                      color: u.role === 'ADMIN' ? '#C81E6E' : '#0369A1',
                    }}
                  >
                    {u.role === 'ADMIN' ? 'Admin' : 'Employé'}
                  </span>
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="text-xs font-medium px-2 py-1 hover:underline"
                    style={{ color: '#EF4444' }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
