import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useT } from '@/lib/i18n/I18nProvider';
import { PERMISSION_RESOURCES, ALL_ACTIONS } from '@/lib/rbac';

export default function PermissionMatrix({ value, onChange, disabled }) {
  const { t } = useT();
  const toggle = (p) => onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);
  const toggleRow = (r) => {
    const ps = r.actions.map((a) => `${r.key}.${a}`);
    const all = ps.every((p) => value.includes(p));
    onChange(all ? value.filter((p) => !ps.includes(p)) : [...new Set([...value, ...ps])]);
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-[12.5px]">
        <thead>
          <tr className="border-b">
            <th className="py-2 pr-3 text-left label-caps">{t('roles.resource')}</th>
            {ALL_ACTIONS.map((a) => <th key={a} className="px-2 py-2 text-center label-caps">{t(`perm.${a}`)}</th>)}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_RESOURCES.map((r) => (
            <tr key={r.key} className="border-b last:border-0 hover:bg-muted/30">
              <td className="py-2.5 pr-3">
                <button disabled={disabled} onClick={() => toggleRow(r)} className="text-left font-medium hover:text-brand disabled:hover:text-inherit">{t(`permRes.${r.key}`)}</button>
                <div className="font-mono text-[10.5px] text-muted-foreground">{r.key}.*</div>
              </td>
              {ALL_ACTIONS.map((a) => {
                const p = `${r.key}.${a}`;
                return (
                  <td key={a} className="px-2 py-2.5 text-center">
                    {r.actions.includes(a) ? <Checkbox checked={value.includes(p)} disabled={disabled} onCheckedChange={() => toggle(p)} aria-label={p} /> : <span className="text-muted-foreground/40">·</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}