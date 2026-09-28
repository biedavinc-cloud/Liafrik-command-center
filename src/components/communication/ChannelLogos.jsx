import React from 'react';
import { Mail, Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const icon = (slug) => `https://cdn.simpleicons.org/${slug}`;
export const CHANNEL_LOGOS = {
  resend: icon('resend'),
  gmail: icon('gmail'),
  slack: icon('slack'),
  telegram: icon('telegram'),
  whatsapp: icon('whatsapp'),
  outlook: icon('microsoftoutlook'),
  teams: icon('microsoftteams'),
  meet: icon('googlemeet'),
  twilio: icon('twilio'),
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