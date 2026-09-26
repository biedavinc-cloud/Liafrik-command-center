import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, Cpu, ShieldAlert } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { roleOfUser } from '@/lib/rbac';
import { useT } from '@/lib/i18n/I18nProvider';
import { useFounderMode } from '@/lib/hooks/useFounderMode';
import { useSystemState, useAction } from '@/lib/data/hooks';
import { enableSafeMode, disableSafeMode } from '@/lib/services/systemState';

export default function UserMenu() {
  const { t } = useT();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = user?.full_name || user?.email || '';
  const initials = name.split(/[\s@]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const role = t(`roles.${roleOfUser(user)}`);
  const { enabled: founderMode, toggle: toggleFounderMode } = useFounderMode();
  const isSuperAdmin = roleOfUser(user) === 'superadmin';
  const { data: sysStates = [] } = useSystemState();
  const safeModeActive = sysStates[0]?.safe_mode_enabled || false;
  const safeModeAction = useAction(
    async () => safeModeActive ? disableSafeMode(user?.email) : enableSafeMode('Activated by SuperAdmin', user?.email),
    ['systemState'],
    true
  );
  const toggleSafeMode = () => safeModeAction.mutate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-muted">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10.5px] font-semibold text-primary-foreground">{initials}</span>
          <span className="hidden text-left leading-tight lg:block">
            <span className="block max-w-[120px] truncate text-[12px] font-medium">{name}</span>
            <span className="block text-[10.5px] text-brand">{role}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-[12.5px] font-medium">{name}</div>
          <div className="text-[11px] text-muted-foreground">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={() => navigate('/settings')}><User className="h-3.5 w-3.5" />{t('user.profile')}</DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={() => navigate('/security')}><Shield className="h-3.5 w-3.5" />{t('nav.security')}</DropdownMenuItem>
        {isSuperAdmin && (
          <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={toggleFounderMode}>
            <Cpu className={`h-3.5 w-3.5 ${founderMode ? 'text-brand' : 'text-muted-foreground'}`} />
            <span className="flex-1">{t('founderMode.label')}</span>
            <span className={`h-3.5 w-6 rounded-full p-0.5 transition-colors ${founderMode ? 'bg-brand' : 'bg-muted'}`}>
              <span className={`block h-2.5 w-2.5 rounded-full bg-white transition-transform ${founderMode ? 'translate-x-2.5' : ''}`} />
            </span>
          </DropdownMenuItem>
        )}
        {isSuperAdmin && (
          <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={toggleSafeMode} disabled={safeModeAction.isPending}>
            <ShieldAlert className={`h-3.5 w-3.5 ${safeModeActive ? 'text-amber-600' : 'text-muted-foreground'}`} />
            <span className="flex-1">{t('safeMode.label')}</span>
            <span className={`h-3.5 w-6 rounded-full p-0.5 transition-colors ${safeModeActive ? 'bg-amber-500' : 'bg-muted'}`}>
              <span className={`block h-2.5 w-2.5 rounded-full bg-white transition-transform ${safeModeActive ? 'translate-x-2.5' : ''}`} />
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={() => logout()}><LogOut className="h-3.5 w-3.5" />{t('user.signOut')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}