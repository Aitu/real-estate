'use client';

import { useCallback, useEffect, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Mode = 'light' | 'dark';

const STORAGE_KEY = 'luxnest-color-mode';

function applyMode(mode: Mode) {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY) as Mode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored ?? (prefersDark ? 'dark' : 'light');

    setMode(initial);
    applyMode(initial);
    setIsReady(true);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((current) => {
      const next: Mode = current === 'dark' ? 'light' : 'dark';
      applyMode(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const nextLabel = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      aria-label={nextLabel}
      className="relative rounded-full border border-slate-200 bg-white/70 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
    >
      <SunMedium
        className={cn(
          'h-4 w-4 transition-transform duration-300',
          mode === 'dark' ? '-rotate-90 scale-0' : 'scale-100 rotate-0',
          !isReady && 'opacity-0'
        )}
        aria-hidden={mode === 'dark'}
      />
      <MoonStar
        className={cn(
          'absolute h-4 w-4 transition-transform duration-300',
          mode === 'dark' ? 'scale-100 rotate-0' : 'rotate-90 scale-0',
          !isReady && 'opacity-0'
        )}
        aria-hidden={mode !== 'dark'}
      />
    </Button>
  );
}
