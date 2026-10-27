import {createClient} from '@supabase/supabase-js';
import { IS_DEMO, HAS_CLOUD_CONFIG } from '@/lib/app-mode';
export async function GET() {
  if(IS_DEMO) return Response.json({status:'demo',databaseVerified:false},{headers:{'Cache-Control':'no-store'}});
  if(!HAS_CLOUD_CONFIG) return Response.json({status:'setup_required',databaseVerified:false},{status:503,headers:{'Cache-Control':'no-store'}});
  try {
    const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(5000)})}});
    const {data,error}=await client.rpc('agency_health');
    return Response.json({status:!error && data===true ? 'ok' : 'unavailable',databaseVerified:!error && data===true},{status:!error && data===true ? 200 : 503,headers:{'Cache-Control':'no-store'}});
  } catch {return Response.json({status:'unavailable',databaseVerified:false},{status:503,headers:{'Cache-Control':'no-store'}});}
}
