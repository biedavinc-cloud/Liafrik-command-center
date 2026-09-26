import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/I18nProvider';

export default function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, destructive, requireText, onConfirm }) {
  const { t } = useT();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setTyped(''); }, [open]);
  const blocked = requireText && typed !== requireText;

  const confirm = async () => {
    setBusy(true);
    await onConfirm().finally(() => setBusy(false));
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[15px]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[12.5px] leading-relaxed">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireText && (
          <div className="space-y-1.5">
            <p className="text-[12px] text-muted-foreground">{t('confirm.typeToConfirm', { text: requireText })}</p>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} className="h-9 font-mono text-[12.5px]" autoFocus />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} className="h-9 text-[12.5px]">{t('common.cancel')}</AlertDialogCancel>
          <Button onClick={confirm} disabled={blocked || busy} variant={destructive ? 'destructive' : 'default'} className="h-9 text-[12.5px]">
            {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {confirmLabel || t('common.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}