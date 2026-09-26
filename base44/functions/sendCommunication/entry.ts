import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── Channel status ──────────────────────────────────────────
    if (action === 'status') {
      let slackConnected = false;
      let gmailConnected = false;
      try {
        await base44.asServiceRole.connectors.getConnection('slackbot');
        slackConnected = true;
      } catch (_) { /* not connected */ }
      try {
        await base44.asServiceRole.connectors.getConnection('gmail');
        gmailConnected = true;
      } catch (_) { /* not connected */ }

      const channels = [
        { key: 'email', name: 'Email (Built-in)', configured: true, type: 'email', icon: 'mail', description: 'Send transactional emails via the platform built-in mailer' },
        { key: 'resend', name: 'Resend', configured: !!secrets.get('RESEND_API_KEY'), type: 'email', icon: 'send', description: 'Developer-friendly transactional email via Resend API' },
        { key: 'gmail', name: 'Gmail', configured: gmailConnected, type: 'email', icon: 'mail', description: 'Send as yourself via Gmail OAuth connector' },
        { key: 'slack', name: 'Slack', configured: slackConnected, type: 'chat', icon: 'slack', description: 'Post alerts and updates to Slack channels via bot connector' },
        { key: 'telegram', name: 'Telegram', configured: !!secrets.get('TELEGRAM_BOT_TOKEN'), type: 'chat', icon: 'telegram', description: 'Send instant messages via Telegram Bot API' },
        { key: 'whatsapp', name: 'WhatsApp', configured: !!secrets.get('WHATSAPP_TOKEN') && !!secrets.get('WHATSAPP_PHONE_ID'), type: 'chat', icon: 'whatsapp', description: 'Reach clients on WhatsApp Business Cloud API' },
      ];
      return Response.json({ channels });
    }

    // ── Send message ─────────────────────────────────────────────
    if (action === 'send') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

      const { channel, recipient, recipient_name, subject, text, application_id, application_name, direction } = body;
      if (!channel || !recipient || !text) return Response.json({ error: 'channel, recipient and text are required' }, { status: 400 });

      // Create pending log
      const log = await base44.asServiceRole.entities.OutboundMessage.create({
        channel, recipient, recipient_name: recipient_name || '', subject: subject || '', body: text,
        status: 'pending', application_id: application_id || '', application_name: application_name || '',
        sent_by: user.id, sent_by_email: user.email, direction: direction || 'external',
      });

      try {
        let providerId = '';

        // ── Email (built-in SendEmail) ──
        if (channel === 'email') {
          const result = await base44.asServiceRole.integrations.Core.SendEmail({
            to: recipient,
            subject: subject || 'Message from Liafrik',
            body: text,
          });
          providerId = result?.messageId || '';
        }

        // ── Resend ──
        else if (channel === 'resend') {
          const apiKey = secrets.get('RESEND_API_KEY');
          if (!apiKey) throw new Error('Resend API key not configured. Set RESEND_API_KEY in Secrets.');
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Liafrik <noreply@resend.dev>',
              to: recipient,
              subject: subject || 'Message from Liafrik',
              text,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Resend API error');
          providerId = data.id || '';
        }

        // ── Gmail (connector) ──
        else if (channel === 'gmail') {
          let accessToken;
          try {
            ({ accessToken } = await base44.asServiceRole.connectors.getConnection('gmail'));
          } catch (_) {
            throw new Error('Gmail connector not authorized. Connect it in Integrations.');
          }
          const emailLines = [
            `To: ${recipient}`,
            `Subject: ${subject || 'Message from Liafrik'}`,
            'Content-Type: text/plain; charset=utf-8',
            '',
            text,
          ].join('\r\n');
          const encoded = btoa(unescape(encodeURIComponent(emailLines)));
          const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw: encoded }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || 'Gmail API error');
          providerId = data.id || '';
        }

        // ── Slack (slackbot connector) ──
        else if (channel === 'slack') {
          let accessToken;
          try {
            ({ accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot'));
          } catch (_) {
            throw new Error('Slack bot connector not authorized. Connect it in Integrations.');
          }
          const res = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel: recipient,
              text: `${subject ? `*${subject}*\n\n` : ''}${text}`,
            }),
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || 'Slack API error');
          providerId = data.ts || '';
        }

        // ── Telegram (Bot API) ──
        else if (channel === 'telegram') {
          const token = secrets.get('TELEGRAM_BOT_TOKEN');
          if (!token) throw new Error('Telegram bot token not configured. Set TELEGRAM_BOT_TOKEN in Secrets.');
          const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: recipient,
              text: `${subject ? `${subject}\n\n` : ''}${text}`,
            }),
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.description || 'Telegram API error');
          providerId = String(data.result?.message_id || '');
        }

        // ── WhatsApp (Cloud API) ──
        else if (channel === 'whatsapp') {
          const token = secrets.get('WHATSAPP_TOKEN');
          const phoneId = secrets.get('WHATSAPP_PHONE_ID');
          if (!token || !phoneId) throw new Error('WhatsApp not configured. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in Secrets.');
          const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: recipient,
              type: 'text',
              text: { body: `${subject ? subject + '\n\n' : ''}${text}` },
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || 'WhatsApp API error');
          providerId = data.messages?.[0]?.id || '';
        }

        else {
          throw new Error(`Unknown channel: ${channel}`);
        }

        // Update log to sent
        await base44.asServiceRole.entities.OutboundMessage.update(log.id, {
          status: 'sent', provider_message_id: providerId,
        });

        // Audit
        await base44.asServiceRole.entities.AuditEvent.create({
          actor: user.email, actor_role: user.role || 'admin',
          action: 'communication.send', resource: 'OutboundMessage', resource_id: log.id,
          outcome: 'success', risk_level: 'low',
          application_name: application_name || '',
          before: '', after: `${channel} → ${recipient}`,
        });

        return Response.json({ status: 'sent', messageId: providerId, logId: log.id });
      } catch (error) {
        await base44.asServiceRole.entities.OutboundMessage.update(log.id, {
          status: 'failed', error: error.message,
        });
        return Response.json({ error: error.message, logId: log.id }, { status: 500 });
      }
    }

    return Response.json({ error: 'Unknown action. Use "status" or "send".' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}