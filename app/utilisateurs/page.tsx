'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { orders: number };
}

const fieldClasses =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:bg-white transition-all text-sm';

function focusPink(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.boxShadow = '0 0 0 3px rgba(200, 30, 110, 0.15)';
  e.target.style.borderColor = '#C81E6E';
}
function blurPink(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.boxShadow = 'none';
  e.target.style.borderColor = '';
}

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

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
            >
              Utilisateurs
            </h1>
            <p className="text-xs text-slate-400 italic">Gestion des accès</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm font-medium px-4 py-2.5 rounded-xl text-white"
            style={{
              background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
              boxShadow: '0 8px 20px -8px rgba(200, 30, 110, 0.5)',
            }}
          >
            {showForm ? 'Annuler' : '+ Utilisateur'}
          </button>
        </div>

        {showForm && (
          <div
            className="bg-white rounded-2xl p-5 mb-5"
            style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
          >
            <h2
              className="font-semibold mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
            >
              Nouveau compte
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input
                type="text"
                placeholder="Nom complet"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={focusPink}
                onBlur={blurPink}
                className={fieldClasses}
              />
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={focusPink}
                onBlur={blurPink}
                className={fieldClasses}
              />
              <input
                type="password"
                placeholder="Mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={focusPink}
                onBlur={blurPink}
                className={fieldClasses}
              />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={focusPink}
                onBlur={blurPink}
                className={fieldClasses}
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'EMPLOYEE' | 'ADMIN')}
                onFocus={focusPink}
                onBlur={blurPink}
                className={fieldClasses}
              >
                <option value="EMPLOYEE">Employé</option>
                <option value="ADMIN">Administrateur</option>
              </select>

              {formError && (
                <p className="text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white font-semibold py-3 rounded-xl disabled:opacity-50"
                style={{ background: '#C81E6E' }}
              >
                {submitting ? 'Création...' : 'Créer le compte'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-center text-slate-400 text-sm py-8">Chargement...</p>
        ) : error ? (
          <p className="text-center text-red-500 text-sm py-8">{error}</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-2xl p-4 flex justify-between items-center"
                style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
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
                    className="text-xs font-medium px-2 py-1"
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
