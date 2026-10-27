import { createClient } from '@/lib/supabase/server';
import { HAS_CLOUD_CONFIG, IS_DEMO } from '@/lib/app-mode';
export async function GET(request:Request) {
  const url=new URL(request.url);
  const code=url.searchParams.get('code');
  if(!IS_DEMO && HAS_CLOUD_CONFIG && code) {
    const {error}=await (await createClient()).auth.exchangeCodeForSession(code);
    if(!error) return Response.redirect(new URL(url.searchParams.get('next')==='/account/password' ? '/account/password' : '/',url.origin),303);
  }
  return Response.redirect(new URL('/login',url.origin),303);
}
