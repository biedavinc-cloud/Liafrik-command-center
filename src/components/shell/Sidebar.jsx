import React from 'react';
import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';
import { NAV_SECTIONS } from './navConfig';

export default function Sidebar({ collapsed, onToggle, onNavigate }) {
  const { t } = useT();
  return (
    <aside className={cn('flex h-full flex-col bg-ink text-slate-300 transition-[width] duration-300 ease-out', collapsed ? 'w-[68px]' : 'w-[244px]')}>
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand text-[13px] font-bold text-ink">L</div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="text-[12.5px] font-semibold tracking-[0.14em] text-white">LIAFRIK</div>
            <div className="text-[9.5px] font-medium tracking-[0.2em] text-slate-400">{t('brand.sub')}</div>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4 scrollbar-none">
        {NAV_SECTIONS.map((s) => (
          <div key={s.group}>
            {!collapsed && <div className="px-2.5 pb-1.5 text-[9.5px] font-medium uppercase tracking-[0.18em] text-slate-500">{t(`navGroup.${s.group}`)}</div>}
            <div className="space-y-0.5">
              {s.items.map((it) => (
                <NavLink
                  key={it.key}
                  to={it.path}
                  end={it.path === '/'}
                  onClick={onNavigate}
                  title={collapsed ? t(`nav.${it.key}`) : undefined}
                  className={({ isActive }) => cn(
                    'group relative flex items-center gap-3 rounded-md px-2.5 py-[7px] text-[12.5px] transition-colors duration-150',
                    collapsed && 'justify-center',
                    isActive ? 'bg-white/[0.07] text-white' : 'hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-brand" />}
                      <it.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-200')} />
                      {!collapsed && <span className="flex-1 truncate">{t(`nav.${it.key}`)}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      {onToggle && (
        <button onClick={onToggle} className={cn('flex h-11 shrink-0 items-center gap-2 border-t border-white/[0.06] px-5 text-[11.5px] text-slate-400 transition-colors hover:text-white', collapsed && 'justify-center px-0')}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" />{t('shell.collapse')}</>}
        </button>
      )}
    </aside>
  );
}