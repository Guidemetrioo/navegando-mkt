/** Production is the safe default. Demonstration must be enabled explicitly. */
export const IS_DEMO = process.env.NEXT_PUBLIC_APP_MODE === 'demo';
export const HAS_CLOUD_CONFIG = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') &&
  !/your-project|placeholder|SEU-PROJETO/i.test(process.env.NEXT_PUBLIC_SUPABASE_URL || '') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !/your-anon|placeholder|SUA-CHAVE/i.test(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
);
