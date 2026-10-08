/** Safe environment readers with explicit fallback defaults. */

export function envStr(key: string, fallback = ""): string {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
}

export function envBool(key: string, fallback = false): boolean {
  const v = process.env[key];
  if (typeof v !== "string") return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

export function envInt(key: string, fallback: number): number {
  const v = Number(process.env[key]);
  return Number.isFinite(v) ? v : fallback;
}

export const ENV = {
  get appUrl() {
    return envStr("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  },
  get databaseUrl() {
    return envStr("DATABASE_URL");
  },
  get sessionSecret() {
    return envStr("SESSION_SECRET", "domainsniper-dev-secret-0x9f4c");
  },
  get cronSecret() {
    return envStr("CRON_SECRET");
  },
  get stripeSecret() {
    return envStr("STRIPE_SECRET_KEY");
  },
  get stripeWebhookSecret() {
    return envStr("STRIPE_WEBHOOK_SECRET");
  },
  get stripePublishable() {
    return envStr("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  },
  get razorpayKeyId() {
    return envStr("RAZORPAY_KEY_ID");
  },
  get razorpayKeySecret() {
    return envStr("RAZORPAY_KEY_SECRET");
  },
  get razorpayWebhookSecret() {
    return envStr("RAZORPAY_WEBHOOK_SECRET");
  },
  get resendApiKey() {
    return envStr("RESEND_API_KEY");
  },
  get telegramBotToken() {
    return envStr("TELEGRAM_BOT_TOKEN");
  },
  get telegramChatId() {
    return envStr("TELEGRAM_CHAT_ID");
  },
  get whatsappToken() {
    return envStr("WHATSAPP_CLOUD_TOKEN");
  },
  get whatsappPhoneId() {
    return envStr("WHATSAPP_PHONE_NUMBER_ID");
  },
} as const;

export const BILLING = {
  get stripeConfigured() {
    return ENV.stripeSecret.startsWith("sk_");
  },
  get razorpayConfigured() {
    return ENV.razorpayKeyId.length > 0 && ENV.razorpayKeySecret.length > 0;
  },
} as const;

export const NOTIFY = {
  get telegramConfigured() {
    return ENV.telegramBotToken.length > 0 && ENV.telegramChatId.length > 0;
  },
  get whatsappConfigured() {
    return ENV.whatsappToken.length > 0 && ENV.whatsappPhoneId.length > 0;
  },
  get emailConfigured() {
    return ENV.resendApiKey.length > 0;
  },
} as const;
