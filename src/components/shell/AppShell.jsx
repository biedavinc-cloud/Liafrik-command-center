import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from './CommandPalette';
import SafeModeBanner from './SafeModeBanner';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('lcc.sidebar') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { document.getElementById('lcc-main')?.scrollTo(0, 0); }, [pathname]);

  const toggle = () => { localStorage.setItem('lcc.sidebar', collapsed ? '0' : '1'); setCollapsed(!collapsed); };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden lg:block"><Sidebar collapsed={collapsed} onToggle={toggle} /></div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[256px] border-0 bg-ink p-0 [&>button]:text-white">
            <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onMenu={() => setMobileOpen(true)} onSearch={() => setPaletteOpen(true)} />
          <SafeModeBanner />
          <main id="lcc-main" className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1560px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <Outlet />
            </div>
          </main>
        </div>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </TooltipProvider>
  );
}