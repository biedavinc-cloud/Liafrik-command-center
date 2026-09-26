import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';
import { capabilityMap } from '@/lib/protocol/capabilities';

export default function AppTabs({ slug, tabs }) {
  const { t } = useT();
  return (
    <nav className="-mx-4 mb-5 flex gap-0.5 overflow-x-auto border-b px-4 scrollbar-none sm:mx-0 sm:px-0">
      {tabs.map((k) => (
        <NavLink
          key={k}
          end
          to={k === 'overview' ? `/apps/${slug}` : `/apps/${slug}/${k}`}
          className={({ isActive }) => cn('relative whitespace-nowrap px-3 pb-2.5 pt-1 text-[12.5px] font-medium transition-colors', isActive ? 'text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:rounded-full after:bg-brand' : 'text-muted-foreground hover:text-foreground')}
        >
          {capabilityMap[k] && !['settings'].includes(k) ? t(`cap.${k}`) : t(`appTabs.${k}`)}
        </NavLink>
      ))}
    </nav>
  );
}