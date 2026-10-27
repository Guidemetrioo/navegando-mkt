import { createClient } from '@/lib/supabase/server';
import { IS_DEMO, HAS_CLOUD_CONFIG } from '@/lib/app-mode';
export async function GET(request:Request) {
  const url=new URL(request.url),token_hash=url.searchParams.get('token_hash'),type=url.searchParams.get('type');
  if(!IS_DEMO && HAS_CLOUD_CONFIG && token_hash && (type==='invite' || type==='recovery')) {
    const {error}=await (await createClient()).auth.verifyOtp({token_hash,type});
    if(!error) return Response.redirect(new URL('/account/password',url.origin),303);
  }
  return Response.redirect(new URL('/login',url.origin),303);
}
