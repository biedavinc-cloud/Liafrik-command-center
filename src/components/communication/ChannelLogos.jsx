import React from 'react';
import { Mail, Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CHANNEL_LOGOS = {
  resend: 'https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/e955bddc7_resend-icon-black.svg',
  gmail: 'https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/2d412a3a6_google_mail_gmail_logo_icon_159346.webp',
  slack: 'https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/0bd3d4116_Slack_Mark_Web.png',
  telegram: 'https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/0e8acf38f_telegram-logo-on-transparent-isolated-background-free-vector.jpg',
  whatsapp: 'https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/866010786_whatsapp-logo-7.png',
  outlook: 'https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/74cdf3896_apps486771437451207069775125968c71-506c-4ac6-a02b-fe78a2531693.png',
  teams: 'https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/5e416a0ff_Microsoft_Office_Teams_2025presentsvg.webp',
  meet: 'https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/68dbec336_google-meet-logo-png_seeklogo-457826.png',
  smtp: 'https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/27fbc0c69_4715fbcbb57e49a11ea559836df28e36.jpg',
  twilio: 'https://media.base44.com/images/public/6ab785600215c73ef9a23ea9/d493ba5be_TWLO-f7d1b0a6.png',
};

const FALLBACK_ICONS = { email: Mail };

export default function ChannelLogo({ channel, className, size = 'md' }) {
  const logo = CHANNEL_LOGOS[channel];
  const Fallback = FALLBACK_ICONS[channel] || MessageSquare;
  const sizeCls = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-12 w-12';
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  if (logo) {
    return (
      <div className={cn('flex items-center justify-center rounded-lg bg-white p-0.5 shrink-0', sizeCls, className)}>
        <img src={logo} alt={channel} className="h-full w-full object-contain" />
      </div>
    );
  }
  return (
    <div className={cn('flex items-center justify-center rounded-lg bg-brand-soft text-brand p-1', sizeCls, className)}>
      <Fallback className={iconSize} />
    </div>
  );
}