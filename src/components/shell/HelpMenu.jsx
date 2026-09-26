import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Command, BookOpen } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/I18nProvider';

export default function HelpMenu({ onPalette }) {
  const { t } = useT();
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:inline-flex" aria-label={t('header.help')}><HelpCircle className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={onPalette}>
          <Command className="h-3.5 w-3.5" />{t('help.palette')}<kbd className="ml-auto text-[10px] text-muted-foreground">Ctrl K</kbd>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={() => navigate('/integrations')}>
          <BookOpen className="h-3.5 w-3.5" />{t('help.protocol')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}