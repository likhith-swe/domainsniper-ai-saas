import { ENV, NOTIFY } from "./env";
import type { AlertChannel } from "./types";

export interface NotifyResult {
  ok: boolean;
  mode: "live" | "simulated";
  latencyMs: number;
  detail: string;
}

async function timed(
  fn: () => Promise<string>,
): Promise<NotifyResult> {
  const started = Date.now();
  try {
    const detail = await fn();
    return { ok: true, mode: "live", latencyMs: Date.now() - started, detail };
  } catch (err) {
    return {
      ok: false,
      mode: "live",
      latencyMs: Date.now() - started,
      detail: err instanceof Error ? err.message : "send-failed",
    };
  }
}

function simulate(reason: string): NotifyResult {
  return { ok: true, mode: "simulated", latencyMs: 0, detail: reason };
}

export async function sendTelegramAlert(message: string): Promise<NotifyResult> {
  if (!NOTIFY.telegramConfigured) return simulate("telegram-not-configured");
  return timed(async () => {
    const res = await fetch(
      `https://api.telegram.org/bot${ENV.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: ENV.telegramChatId, text: message }),
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!res.ok) throw new Error(`telegram-http-${res.status}`);
    return "telegram-sent";
  });
}

export async function sendWhatsAppAlert(message: string): Promise<NotifyResult> {
  if (!NOTIFY.whatsappConfigured) return simulate("whatsapp-not-configured");
  return timed(async () => {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${ENV.whatsappPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.whatsappToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: ENV.telegramChatId || "0000000000",
          type: "text",
          text: { body: message.slice(0, 1024) },
        }),
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!res.ok) throw new Error(`whatsapp-http-${res.status}`);
    return "whatsapp-sent";
  });
}

export async function sendEmailAlert(
  to: string,
  subject: string,
  html: string,
): Promise<NotifyResult> {
  if (!NOTIFY.emailConfigured) return simulate("email-not-configured");
  return timed(async () => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ENV.resendApiKey}`,
      },
      body: JSON.stringify({
        from: ENV.appUrl.includes("localhost")
          ? "DomainSniper <onboarding@resend.dev>"
          : "DomainSniper <radar@domainsniper.ai>",
        to: [to],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`resend-http-${res.status}`);
    return "email-sent";
  });
}

/** Channel router used by tripwires + cron dispatch. */
export async function dispatchAlert(
  channel: AlertChannel,
  message: string,
  to?: string,
): Promise<NotifyResult> {
  switch (channel) {
    case "telegram":
      return sendTelegramAlert(message);
    case "whatsapp":
      return sendWhatsAppAlert(message);
    case "email":
    default:
      return sendEmailAlert(
        to ?? "radar@domainsniper.local",
        "🎯 DomainSniper tripwire fired",
        `<pre style="font-family:monospace;background:#070b09;color:#2ee68d;padding:16px">${message}</pre>`,
      );
  }
}
