'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
];

export function LanguageSwitcher() {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const saved = document.cookie
      .split('; ')
      .find((c) => c.startsWith('locale='))
      ?.split('=')[1];
    if (saved && ['en', 'am'].includes(saved)) setLocale(saved);
  }, []);

  const switchLocale = (code: string) => {
    document.cookie = `locale=${code}; path=/; max-age=31536000; SameSite=Lax`;
    setLocale(code);
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <Globe className="h-4 w-4 text-muted-foreground ml-1" />
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            locale === l.code
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={l.label}
        >
          {l.flag} {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
