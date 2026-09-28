import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en';
import fr from './fr';

const DICTS = { en, fr };
export const LANGUAGES = ['en', 'fr'];
const Ctx = createContext(null);
const resolve = (dict, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lcc.lang') || 'en');


  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('lcc.lang', lang);
  }, [lang]);

  const setLang = useCallback((l) => {
    setLangState(l);
  }, []);

  const value = useMemo(() => {
    const locale = lang === 'fr' ? 'fr-FR' : 'en-US';
    const t = (key, vars) => {
      let s = resolve(DICTS[lang], key) ?? resolve(en, key) ?? key.split('.').pop();
      if (vars && typeof s === 'string') Object.entries(vars).forEach(([k, v]) => { s = s.split(`{${k}}`).join(v); });
      return s;
    };
    const nf = new Intl.NumberFormat(locale);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
    const fmt = {
      number: (n) => nf.format(n ?? 0),
      compact: (n) => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n ?? 0),
      currency: (n, c) => {
        const code = typeof c === 'string' && /^[A-Za-z]{3}$/.test(c) ? c.toUpperCase() : 'AED';
        const value = Number.isFinite(Number(n)) ? Number(n) : 0;
        return new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(value);
      },
      percent: (n, d = 1) => (n == null ? '—' : `${new Intl.NumberFormat(locale, { maximumFractionDigits: d, minimumFractionDigits: d }).format(n)}%`),
      date: (d) => (d ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(d)) : '—'),
      dateTime: (d) => (d ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)) : '—'),
      time: (d) => (d ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : '—'),
      ago: (d) => {
        if (!d) return '—';
        const s = Math.round((new Date(d).getTime() - Date.now()) / 1000);
        const a = Math.abs(s);
        if (a < 60) return rtf.format(s, 'second');
        if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
        if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
        return rtf.format(Math.round(s / 86400), 'day');
      },
    };
    return { lang, setLang, t, fmt, locale };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);