'use client';

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Palette } from 'lucide-react';

const THEMES = [
  { name: 'Light', class: 'theme-light', icon: <Sun className="w-4 h-4" /> },
  { name: 'Dark', class: 'theme-dark', icon: <Moon className="w-4 h-4" /> },
  { name: 'Light Blue', class: 'theme-light-blue', icon: <Palette className="w-4 h-4 text-blue-500" /> },
  { name: 'Dark Blue', class: 'theme-dark-blue', icon: <Palette className="w-4 h-4 text-blue-700" /> },
  { name: 'Light Red', class: 'theme-light-red', icon: <Palette className="w-4 h-4 text-red-500" /> },
  { name: 'Dark Red', class: 'theme-dark-red', icon: <Palette className="w-4 h-4 text-red-700" /> },
  { name: 'Light Green', class: 'theme-light-green', icon: <Palette className="w-4 h-4 text-green-500" /> },
  { name: 'Dark Green', class: 'theme-dark-green', icon: <Palette className="w-4 h-4 text-green-700" /> },
  { name: 'Light Yellow', class: 'theme-light-yellow', icon: <Palette className="w-4 h-4 text-yellow-500" /> },
  { name: 'Dark Yellow', class: 'theme-dark-yellow', icon: <Palette className="w-4 h-4 text-yellow-700" /> },
];

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<string>('theme-light');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('app-theme') || 'theme-light';
    setTheme(saved);
    document.body.classList.add(saved);
  }, []);

  // close popover when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeTheme = (value: string) => {
    document.body.classList.remove(theme);
    document.body.classList.add(value);
    setTheme(value);
    localStorage.setItem('app-theme', value);
    setOpen(false);
  };

  /** Check if current theme is any "dark" variant */
  const isDark =
    theme.includes('dark') ||
    theme === 'theme-dark';

  return ( 
    <div className="relative" ref={ref}>
      {/* Trigger button with inverted colors */}
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded-full transition-colors`}
        style={{
          backgroundColor: 'var(--card-bg)',
          color: 'var(--icon-color)',
        }}
        onMouseEnter={e =>
          (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)')
        }
        onMouseLeave={e =>
          (e.currentTarget.style.backgroundColor = 'var(--card-bg)')
        }
        aria-label="Change theme"
      >
        {/* Icon also flips if you prefer (optional) */}
        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 shadow-lg z-50">
          <div className="py-1">
            {THEMES.map((t) => (
              <button
                key={t.class}
                onClick={() => changeTheme(t.class)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors`}
                style={{
                  backgroundColor: theme === t.class ? 'var(--button-bg)' : 'var(--card-bg)',
                  color: theme === t.class ? 'var(--button-text)' : 'var(--card-text)',
                }}
                onMouseEnter={e =>
                  (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.backgroundColor =
                    theme === t.class ? 'var(--button-bg)' : 'var(--card-bg)')
                }
              >
                {t.icon}
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}