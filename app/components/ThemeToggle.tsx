'use client';

import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const preferred = stored === 'dark' ? 'dark' : 'light';
    setTheme(preferred);
    document.documentElement.classList.toggle('dark', preferred === 'dark');

    // Sécurité : si jamais on navigue vers une page d'auth avec le thème
    // sombre stocké, on ne l'applique jamais là-bas.
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  return { theme, toggleTheme };
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Changer de thème"
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:-translate-y-0.5 ${className}`}
      style={{
        background: 'var(--card-solid)',
        boxShadow: '0 4px 12px -4px rgba(26,26,46,0.12)',
        color: 'var(--text-primary)',
      }}
    >
      <span className="text-base">{theme === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  );
}
