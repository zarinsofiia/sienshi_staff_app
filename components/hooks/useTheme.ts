// hooks/useTheme.ts
import { useState, useEffect } from 'react';

type Theme =
  | 'theme-light'
  | 'theme-dark'
  | 'theme-light-blue'
  | 'theme-dark-blue'
  | 'theme-light-red'
  | 'theme-dark-red'
  | 'theme-light-green'
  | 'theme-dark-green'
  | 'theme-light-yellow'
  | 'theme-dark-yellow';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('theme-light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.body.className = document.body.className
      .split(' ')
      .filter((c) => !c.startsWith('theme-'))
      .join(' ');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}