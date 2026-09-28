import { createPlatform } from "../_shared/platform.js";
import { secrets } from "../_shared/runtime.js";
const CHANNEL_DEFS = [
  {
    key: "email",
    name: "Email (Built-in)",
    type: "email",
    auth: "builtin",
    description: "Transactional emails via the platform built-in mailer"
  },
  {
    key: "resend",
    name: "Resend",
    type: "email",
    auth: "secret",
    description: "Developer-friendly transactional email via Resend API",
    fields: [{ key: "api_key", label: "API Key", type: "password", required: true }]
  },
  {
    key: "gmail",
    name: "Gmail",
    type: "email",
    auth: "oauth",
    connector: "gmail",
    description: "Send as yourself via Gmail OAuth connector"
  },
  {
    key: "outlook",
    name: "Outlook",
    type: "email",
    auth: "oauth",
    connector: "outlook",
    description: "Send via Microsoft Outlook Graph API"
  },
  {
    key: "smtp",
    name: "SMTP Relay",
    type: "email",
    auth: "secret",
    description: "Custom from address via configurable SMTP relay",
    fields: [
      { key: "from_email", label: "From Email", type: "text", required: true },
      { key: "from_name", label: "From Name", type: "text", required: false }
    ]
  },
  {
    key: "slack",
    name: "Slack",
    type: "chat",
    auth: "oauth",
    connector: "slackbot",
    description: "Post messages to Slack channels via bot connector"
  },
  {
    key: "teams",
    name: "Microsoft Teams",
    type: "chat",
    auth: "oauth",
    connector: "microsoft_teams",
    composable: false,
    description: "Post messages to Teams channels via connector (automation only)"
  },
  {
    key: "telegram",
    name: "Telegram",
    type: "chat",
    auth: "secret",
    description: "Send instant messages via Telegram Bot API",
    fields: [{ key: "bot_token", label: "Bot Token", type: "password", required: true }]
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    type: "chat",
    auth: "secret",
    description: "Reach clients on WhatsApp Business Cloud API",
    fields: [
      { key: "token", label: "Access Token", type: "password", required: true },
      { key: "phone_id", label: "Phone Number ID", type: "text", required: true }
    ]
  },
  {
    key: "twilio",
    name: "Twilio (SMS)",
    type: "sms",
    auth: "secret",
    description: "Send SMS messages via Twilio REST API",
    fields: [
      { key: "account_sid", label: "Account SID", type: "text", required: true },
      { key: "auth_token", label: "Auth Token", type: "password", required: true },
      { key: "from_number", label: "From Number (+123...)", type: "text", required: true }
    ]
  },
  {
    key: "meet",
    name: "Google Meet",
    type: "video",
    auth: "oauth",
    connector: "googlemeet",
    composable: false,
    description: "Create Google Meet video meetings via connector (automation only)"
  }
];
function maskValue(val) {
  if (!val || typeof val !== "string") return "";
  if (val.length <= 4) return "\u2022\u2022\u2022\u2022";
  return val.slice(0, 2) + "\u2022\u2022\u2022\u2022" + val.slice(-2);
}
function generateHints(credentials) {
  const hints = {};
  for (const [key, value] of Object.entries(credentials || {})) {
    hints[key] = maskValue(String(value));
  }
  return hints;
}
async function getChannelConfig(platform, channel) {
  const configs = await platform.asServiceRole.entities.CommunicationChannel.filter({ channel });
  return configs[0] || null;
}
async function getCredential(platform, channel, key) {
  const config = await getChannelConfig(platform, channel);
  if (config?.credentials?.[key]) return config.credentials[key];
  return secrets.get(key.toUpperCase()) || null;
}
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { action } = body;
    if (action === "status") {
      const configs = await platform.asServiceRole.entities.CommunicationChannel.list();
      const configMap = {};
      for (const c of configs) configMap[c.channel] = c;
      const channels = [];
      for (const def of CHANNEL_DEFS) {
        let configured = false;
        let hints = {};
        if (def.auth === "builtin") {
          configured = true;
        } else if (def.auth === "secret") {
          const config = configMap[def.key];
          configured = !!config?.configured;
          if (!configured && def.fields) {
            configured = !!secrets.get(def.fields[0].key.toUpperCase());
          }
          hints = config?.credential_hints || {};
        } else if (def.auth === "oauth") {
          try {
            await platform.asServiceRole.connectors.getConnection(def.connector);
            configured = true;
          } catch (_) {
          }
        }
        channels.push({
          key: def.key,
          name: def.name,
          type: def.type,
          auth: def.auth,
          composable: def.composable !== false,
          description: def.description,
          fields: def.fields || [],
          connector: def.connector || null,
          configured,
          hints,
          last_tested: configMap[def.key]?.last_tested || null,
          last_test_result: configMap[def.key]?.last_test_result || null
        });
      }
      return Response.json({ channels });
    }
    if (action === "configure") {
      if (user.role !== "admin") return Response.json({ error: "Forbidden \u2014 admin only" }, { status: 403 });
      const { channel, credentials } = body;
      const def = CHANNEL_DEFS.find((c) => c.key === channel);
      if (!def) return Response.json({ error: "Unknown channel" }, { status: 400 });
      if (def.auth !== "secret") return Response.json({ error: "Only secret-based channels can be configured here. OAuth channels need connector authorization." }, { status: 400 });
      for (const field of def.fields) {
        if (field.required && !credentials[field.key]) {
          return Response.json({ error: `${field.label} is required` }, { status: 400 });
        }
      }
      const hints = generateHints(credentials);
      const existing = await getChannelConfig(platform, channel);
      if (existing) {
        await platform.asServiceRole.entities.CommunicationChannel.update(existing.id, {
          credentials,
          credential_hints: hints,
          configured: true,
          enabled: true,
          configured_by: user.id,
          configured_by_email: user.email
        });
      } else {
        await platform.asServiceRole.entities.CommunicationChannel.create({
          channel,
          display_name: def.name,
          credentials,
          credential_hints: hints,
          configured: true,
          enabled: true,
          configured_by: user.id,
          configured_by_email: user.email
        });
      }
      await platform.asServiceRole.entities.AuditEvent.create({
        actor: user.email,
        actor_role: user.role || "admin",
        action: "communication.configure",
        resource: "CommunicationChannel",
        resource_id: channel,
        outcome: "success",
        risk_level: "medium",
        before: "",
        after: `Channel ${channel} configured`
      });
      return Response.json({ status: "configured", channel });
    }
    if (action === "delete_config") {
      if (user.role !== "admin") return Response.json({ error: "Forbidden \u2014 admin only" }, { status: 403 });
      const { channel } = body;
      const existing = await getChannelConfig(platform, channel);
      if (existing) {
        await platform.asServiceRole.entities.CommunicationChannel.delete(existing.id);
      }
      return Response.json({ status: "deleted", channel });
    }
    if (action === "test") {
      if (user.role !== "admin") return Response.json({ error: "Forbidden \u2014 admin only" }, { status: 403 });
      const { channel } = body;
      const def = CHANNEL_DEFS.find((c) => c.key === channel);
      if (!def) return Response.json({ error: "Unknown channel" }, { status: 400 });
      let testResult = "";
      try {
        if (channel === "email") {
          await platform.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: "Liafrik Test",
            body: "Test from Liafrik Communication Center."
          });
          testResult = "Test email sent successfully";
        } else if (channel === "resend") {
          const apiKey = await getCredential(platform, "resend", "api_key");
          if (!apiKey) throw new Error("Resend API key not configured");
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: "Liafrik <noreply@resend.dev>", to: user.email, subject: "Liafrik Test", text: "Test from Liafrik Communication Center." })
          });
          if (!res.ok) {
            const d = await res.json();
            throw new Error(d.message || "Resend error");
          }
          testResult = "Test email sent via Resend \u2713";
        } else if (channel === "smtp") {
          testResult = "SMTP from-address configured \u2713";
        } else if (channel === "telegram") {
          const token = await getCredential(platform, "telegram", "bot_token");
          if (!token) throw new Error("Telegram bot token not configured");
          const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
          const d = await res.json();
          if (!d.ok) throw new Error(d.description || "Telegram error");
          testResult = `Connected as @${d.result.username}`;
        } else if (channel === "whatsapp") {
          const token = await getCredential(platform, "whatsapp", "token");
          if (!token) throw new Error("WhatsApp not configured");
          testResult = "WhatsApp credentials stored \u2713";
        } else if (channel === "twilio") {
          const sid = await getCredential(platform, "twilio", "account_sid");
          const authToken = await getCredential(platform, "twilio", "auth_token");
          if (!sid || !authToken) throw new Error("Twilio not configured");
          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
            headers: { "Authorization": "Basic " + btoa(`${sid}:${authToken}`) }
          });
          if (!res.ok) throw new Error("Twilio credentials invalid");
          const d = await res.json();
          testResult = `Connected as ${d.friendly_name}`;
        } else if (def.auth === "oauth") {
          try {
            await platform.asServiceRole.connectors.getConnection(def.connector);
            testResult = `${def.name} connector authorized \u2713`;
          } catch (_) {
            throw new Error(`${def.name} connector not authorized`);
          }
        }
        const existing = await getChannelConfig(platform, channel);
        if (existing) {
          await platform.asServiceRole.entities.CommunicationChannel.update(existing.id, {
            last_tested: (/* @__PURE__ */ new Date()).toISOString(),
            last_test_result: testResult
          });
        }
        return Response.json({ status: "tested", channel, result: testResult });
      } catch (error) {
        const existing = await getChannelConfig(platform, channel);
        if (existing) {
          await platform.asServiceRole.entities.CommunicationChannel.update(existing.id, {
            last_tested: (/* @__PURE__ */ new Date()).toISOString(),
            last_test_result: `Error: ${error.message}`
          });
        }
        return Response.json({ error: error.message }, { status: 500 });
      }
    }
    if (action === "send") {
      if (user.role !== "admin") return Response.json({ error: "Forbidden \u2014 admin only" }, { status: 403 });
      const { channel, recipient, recipient_name, subject, text, application_id, application_name, direction } = body;
      if (!channel || !recipient || !text) return Response.json({ error: "channel, recipient and text are required" }, { status: 400 });
      const log = await platform.asServiceRole.entities.OutboundMessage.create({
        channel,
        recipient,
        recipient_name: recipient_name || "",
        subject: subject || "",
        body: text,
        status: "pending",
        application_id: application_id || "",
        application_name: application_name || "",
        sent_by: user.id,
        sent_by_email: user.email,
        direction: direction || "external"
      });
      try {
        let providerId = "";
        if (channel === "email") {
          const result = await platform.asServiceRole.integrations.Core.SendEmail({
            to: recipient,
            subject: subject || "Message from Liafrik",
            body: text
          });
          providerId = result?.messageId || "";
        } else if (channel === "resend") {
          const apiKey = await getCredential(platform, "resend", "api_key");
          if (!apiKey) throw new Error("Resend not configured. Configure it in the Communication Center.");
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: "Liafrik <noreply@resend.dev>", to: recipient, subject: subject || "Message from Liafrik", text })
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.message || "Resend API error");
          providerId = d.id || "";
        } else if (channel === "smtp") {
          const config = await getChannelConfig(platform, "smtp");
          const fromName = config?.credentials?.from_name || "Liafrik";
          const result = await platform.asServiceRole.integrations.Core.SendEmail({
            to: recipient,
            subject: subject || "Message from Liafrik",
            body: text,
            from_name: fromName
          });
          providerId = result?.messageId || "";
        } else if (channel === "gmail") {
          let accessToken;
          try {
            ({ accessToken } = await platform.asServiceRole.connectors.getConnection("gmail"));
          } catch (_) {
            throw new Error("Gmail connector not authorized. Configure it in the Communication Center.");
          }
          const emailLines = [`To: ${recipient}`, `Subject: ${subject || "Message from Liafrik"}`, "Content-Type: text/plain; charset=utf-8", "", text].join("\r\n");
          const encoded = btoa(unescape(encodeURIComponent(emailLines))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ raw: encoded })
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.error?.message || "Gmail API error");
          providerId = d.id || "";
        } else if (channel === "outlook") {
          let accessToken;
          try {
            ({ accessToken } = await platform.asServiceRole.connectors.getConnection("outlook"));
          } catch (_) {
            throw new Error("Outlook connector not authorized. Configure it in the Communication Center.");
          }
          const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              message: { subject: subject || "Message from Liafrik", body: { contentType: "Text", content: text }, toRecipients: [{ emailAddress: { address: recipient } }] },
              saveToSentItems: false
            })
          });
          if (!res.ok) {
            const t = await res.text();
            try {
              throw new Error(JSON.parse(t).error?.message || "Outlook API error");
            } catch (e) {
              if (e instanceof SyntaxError) throw new Error("Outlook API error");
              throw e;
            }
          }
          providerId = "sent";
        } else if (channel === "slack") {
          let accessToken;
          try {
            ({ accessToken } = await platform.asServiceRole.connectors.getConnection("slackbot"));
          } catch (_) {
            throw new Error("Slack connector not authorized. Configure it in the Communication Center.");
          }
          const res = await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ channel: recipient, text: `${subject ? `*${subject}*

` : ""}${text}`, username: "Liafrik", icon_emoji: ":rocket:" })
          });
          const d = await res.json();
          if (!d.ok) throw new Error(d.error || "Slack API error");
          providerId = d.ts || "";
        } else if (channel === "teams") {
          let accessToken;
          try {
            ({ accessToken } = await platform.asServiceRole.connectors.getConnection("microsoft_teams"));
          } catch (_) {
            throw new Error("Teams connector not authorized. Configure it in the Communication Center.");
          }
          const [teamId, channelId] = recipient.includes("/") ? recipient.split("/") : [recipient, ""];
          if (!channelId) throw new Error("Teams recipient must be teamId/channelId");
          const res = await fetch(`https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ body: { content: `${subject ? `**${subject}**

` : ""}${text}` } })
          });
          if (!res.ok) {
            const d2 = await res.json();
            throw new Error(d2.error?.message || "Teams API error");
          }
          const d = await res.json();
          providerId = d.id || "";
        } else if (channel === "telegram") {
          const token = await getCredential(platform, "telegram", "bot_token");
          if (!token) throw new Error("Telegram not configured. Configure it in the Communication Center.");
          const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: recipient, text: `${subject ? `${subject}

` : ""}${text}` })
          });
          const d = await res.json();
          if (!d.ok) throw new Error(d.description || "Telegram API error");
          providerId = String(d.result?.message_id || "");
        } else if (channel === "whatsapp") {
          const token = await getCredential(platform, "whatsapp", "token");
          const phoneId = await getCredential(platform, "whatsapp", "phone_id");
          if (!token || !phoneId) throw new Error("WhatsApp not configured. Configure it in the Communication Center.");
          const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ messaging_product: "whatsapp", to: recipient, type: "text", text: { body: `${subject ? subject + "\n\n" : ""}${text}` } })
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.error?.message || "WhatsApp API error");
          providerId = d.messages?.[0]?.id || "";
        } else if (channel === "twilio") {
          const sid = await getCredential(platform, "twilio", "account_sid");
          const authToken = await getCredential(platform, "twilio", "auth_token");
          const fromNumber = await getCredential(platform, "twilio", "from_number");
          if (!sid || !authToken || !fromNumber) throw new Error("Twilio not configured. Configure it in the Communication Center.");
          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: "POST",
            headers: { "Authorization": "Basic " + btoa(`${sid}:${authToken}`), "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ From: fromNumber, To: recipient, Body: `${subject ? subject + "\n\n" : ""}${text}` })
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.error_message || "Twilio API error");
          providerId = d.sid || "";
        } else if (channel === "meet") {
          let accessToken;
          try {
            ({ accessToken } = await platform.asServiceRole.connectors.getConnection("googlemeet"));
          } catch (_) {
            throw new Error("Google Meet connector not authorized. Configure it in the Communication Center.");
          }
          const meetRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              summary: subject || "Liafrik Meeting",
              description: text,
              start: { dateTime: (/* @__PURE__ */ new Date()).toISOString() },
              end: { dateTime: new Date(Date.now() + 30 * 60 * 1e3).toISOString() },
              conferenceData: { createRequest: { requestId: "liafrik-" + Date.now() } },
              attendees: [{ email: recipient }]
            })
          });
          const meetData = await meetRes.json();
          if (!meetRes.ok) throw new Error(meetData.error?.message || "Google Meet API error");
          providerId = meetData.id || "";
        } else {
          throw new Error(`Unknown channel: ${channel}`);
        }
        await platform.asServiceRole.entities.OutboundMessage.update(log.id, { status: "sent", provider_message_id: providerId });
        await platform.asServiceRole.entities.AuditEvent.create({
          actor: user.email,
          actor_role: user.role || "admin",
          action: "communication.send",
          resource: "OutboundMessage",
          resource_id: log.id,
          outcome: "success",
          risk_level: "low",
          application_name: application_name || "",
          before: "",
          after: `${channel} \u2192 ${recipient}`
        });
        return Response.json({ status: "sent", messageId: providerId, logId: log.id });
      } catch (error) {
        await platform.asServiceRole.entities.OutboundMessage.update(log.id, { status: "failed", error: error.message });
        return Response.json({ error: error.message, logId: log.id }, { status: 500 });
      }
    }
    return Response.json({ error: 'Unknown action. Use "status", "configure", "test", "delete_config", or "send".' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  onRequestPost
};
