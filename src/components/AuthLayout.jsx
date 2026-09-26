import React from "react";
import { useT } from "@/lib/i18n/I18nProvider";

const AUTH_BG =
  "https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/26adbfa20_mohamed_hassan-vpn-4046047_1920.jpg";

export default function AuthLayout({ icon: _icon, title, subtitle, footer, children }) {
  const { t } = useT();
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Visual panel */}
      <div className="relative h-28 shrink-0 overflow-hidden lg:h-auto lg:w-[46%]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${AUTH_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/75 to-slate-950/90" />
        <div className="relative z-10 flex h-full items-center justify-center px-6 lg:block lg:p-14">
          {/* Mobile: compact brand mark */}
          <div className="lg:hidden text-center">
            <div className="text-[13px] font-semibold tracking-[0.16em] text-white">LIAFRIK</div>
            <div className="text-[9px] font-medium tracking-[0.2em] text-white/50">Command Center</div>
          </div>
          {/* Desktop: full visual copy */}
          <div className="hidden lg:flex h-full flex-col justify-between text-white">
            <div>
              <div className="text-[13px] font-semibold tracking-[0.16em] text-white">LIAFRIK</div>
              <div className="text-[9.5px] font-medium tracking-[0.2em] text-white/50">Command Center</div>
            </div>
            <div>
              <h2 className="text-[26px] font-semibold leading-snug text-white/95 max-w-sm">
                {t('authPage.secureTitle')}
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-white/55 max-w-sm">
                {t('authPage.secureDesc')}
              </p>
            </div>
            <div className="text-[10px] font-medium tracking-[0.18em] text-white/35">
              Propriété privée de Liafrik
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-10 lg:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-9">
            <p className="text-[11.5px] font-medium tracking-[0.14em] text-muted-foreground mb-5">
              Propriété privée de Liafrik
            </p>
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>}
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-7 sm:p-8">
            {children}
          </div>
          {footer && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-center text-sm text-muted-foreground mt-6">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}