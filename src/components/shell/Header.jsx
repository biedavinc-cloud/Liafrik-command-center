import React from 'react';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/I18nProvider';
import AppSwitcher from './AppSwitcher';
import LanguageToggle from './LanguageToggle';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import HelpMenu from './HelpMenu';
import SystemStatus from './SystemStatus';

export default function Header({ onMenu, onSearch }) {
  const { t } = useT();
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-card/85 px-3 backdrop-blur-md sm:gap-3 sm:px-6">
      <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onMenu} aria-label="menu"><Menu className="h-4 w-4" /></Button>
      <button onClick={onSearch} className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border bg-background px-2.5 text-[12.5px] text-muted-foreground transition-colors hover:border-foreground/20 md:max-w-sm">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{t('header.search')}</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-px text-[10px] font-medium sm:inline">Ctrl K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <SystemStatus className="hidden xl:flex" />
        <AppSwitcher className="hidden md:flex" />
        <LanguageToggle />
        <NotificationBell />
        <HelpMenu onPalette={onSearch} />
        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}