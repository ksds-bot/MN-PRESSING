'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Tableau de bord', path: '/dashboard', icon: '📊', adminOnly: true },
  { label: 'Mon espace', path: '/tableau-employe', icon: '🏠' },
  { label: 'Commandes', path: '/commandes', icon: '🧾' },
  { label: 'Nouvelle commande', path: '/commandes/nouvelle', icon: '➕' },
  { label: 'Bilan', path: '/bilan', icon: '📈', adminOnly: true },
  { label: 'Export', path: '/export', icon: '📤', adminOnly: true },
  { label: 'Utilisateurs', path: '/utilisateurs', icon: '👥', adminOnly: true },
  { label: 'Documentation', path: '/documentation', icon: '📖' },
];

// Le thème sombre n'est proposé que sur ces pages (dashboard admin + espace employé)
const THEME_TOGGLE_ALLOWED_PATHS = ['/dashboard', '/tableau-employe'];

export default function AppMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [showThemeToggle, setShowThemeToggle] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setIsAdmin(user.role === 'ADMIN');
      setUserName(user.name || '');
    }

    const path = window.location.pathname;
    setShowThemeToggle(THEME_TOGGLE_ALLOWED_PATHS.some((p) => path.startsWith(p)));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    document.documentElement.classList.remove('dark');
    router.push('/login');
  }

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  const visibleItems = MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Bouton hamburger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-0.5 shrink-0"
        style={{
          background: 'var(--card-solid)',
          boxShadow: '0 4px 12px -4px rgba(26,26,46,0.12)',
        }}
      >
        <span className="block w-4 h-0.5 rounded-full" style={{ background: 'var(--text-primary)' }} />
        <span className="block w-4 h-0.5 rounded-full" style={{ background: 'var(--text-primary)' }} />
        <span className="block w-4 h-0.5 rounded-full" style={{ background: 'var(--text-primary)' }} />
      </button>

      {/* Overlay + tiroir — rendu au niveau racine avec z-index très élevé */}
      {open && (
        <div className="fixed inset-0" style={{ zIndex: 9999 }}>
          <div
            className="absolute inset-0 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute top-0 right-0 h-full w-72 max-w-[85vw] flex flex-col"
            style={{
              background: 'var(--card-solid)',
              boxShadow: '-12px 0 40px -12px rgba(0,0,0,0.45)',
              animation: 'drawerSlideIn 0.32s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            {/* En-tête tiroir */}
            <div
              className="p-5 relative overflow-hidden shrink-0"
              style={{ background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)' }}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="flex justify-between items-start relative">
                <div>
                  <p className="text-white font-bold font-display text-lg">
                    MN Pressing
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {userName ? `Bonjour ${userName}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fermer le menu"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg bg-white/15 hover:bg-white/25 transition-colors shrink-0"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Liste des actions */}
            <div className="flex-1 overflow-y-auto py-3">
              {visibleItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-soft)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Pied du tiroir : thème (si autorisé) + déconnexion */}
            <div
              className="p-4 flex items-center gap-2 shrink-0"
              style={{ borderTop: '1px solid var(--border-soft)' }}
            >
              {showThemeToggle && <ThemeToggle />}
              <button
                onClick={handleLogout}
                className="flex-1 text-sm font-medium py-2.5 rounded-xl transition-colors"
                style={{ background: '#FEE2E2', color: '#DC2626' }}
              >
                Déconnexion
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes drawerSlideIn {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
