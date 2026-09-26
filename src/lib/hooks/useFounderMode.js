import { useState, useEffect } from 'react';

// Founder Mode: a SuperAdmin-only toggle that reveals advanced technical information
// (API diagnostics, correlation IDs, connector status, protocol version, etc.)
// Stored in localStorage; components read this to conditionally show technical details.
export function useFounderMode() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('lcc.founderMode') === '1');

  useEffect(() => {
    const handler = (e) => setEnabled(e.detail);
    window.addEventListener('founder-mode-change', handler);
    return () => window.removeEventListener('founder-mode-change', handler);
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem('lcc.founderMode', next ? '1' : '0');
    window.dispatchEvent(new CustomEvent('founder-mode-change', { detail: next }));
  };

  return { enabled, toggle };
}