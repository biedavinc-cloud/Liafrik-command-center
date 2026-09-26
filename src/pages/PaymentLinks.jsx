import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { usePaymentLinks } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import EmptyState from '@/components/kit/EmptyState';
import { Button } from '@/components/ui/button';
import { Link2, Copy, ExternalLink, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PaymentLinkDialog from '@/components/payments/PaymentLinkDialog';

export default function PaymentLinks() {
  const { t } = useT();
  const { data: links = [], isLoading } = usePaymentLinks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: t('psp.copied') });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('psp.paymentLinks', { defaultValue: 'Payment Links' })}
        subtitle={t('psp.subtitle')}
        breadcrumbs={[{ label: t('psp.title') }, { label: t('psp.paymentLinks', { defaultValue: 'Payment Links' }) }]}
        actions={<Button onClick={() => setDialogOpen(true)} className="h-9"><Plus className="h-4 w-4 mr-1.5" />{t('psp.createLink')}</Button>}
      />
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-muted border-t-foreground rounded-full animate-spin" /></div>
      ) : links.length === 0 ? (
        <EmptyState icon={Link2} title={t('psp.linkEmpty')} body={t('psp.linkEmptyBody')} action={<Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1.5" />{t('psp.createLink')}</Button>} />
      ) : (
        <div className="surface divide-y">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-4 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
                <Link2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-medium">{link.amount} {link.currency}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9.5px] text-muted-foreground uppercase">{link.provider}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-medium ${
                    link.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    link.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    link.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-muted text-muted-foreground'
                  }`}>{link.status}</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {link.customer_email} · {link.description || '—'} · {new Date(link.created_date).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyLink(link.link_url)}><Copy className="h-3.5 w-3.5" /></Button>
                <a href={link.link_url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button></a>
              </div>
            </div>
          ))}
        </div>
      )}
      <PaymentLinkDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}