/** Build-time-safe client flags (no secrets — only feature switches). */

export const BILLING = {
  /** Sandbox VIP activator is always offered; live rails appear when keys exist. */
  sandboxAvailable: true,
};
