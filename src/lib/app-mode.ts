export const HAS_CLOUD_CONFIG = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') &&
  !/your-project|placeholder|SEU-PROJETO/i.test(process.env.NEXT_PUBLIC_SUPABASE_URL || '') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !/your-anon|placeholder|SUA-CHAVE/i.test(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
);

/** Operational workspace is active whenever Supabase cloud is not configured or when explicitly requested */
export const IS_DEMO = !HAS_CLOUD_CONFIG || process.env.NEXT_PUBLIC_APP_MODE !== 'production';
