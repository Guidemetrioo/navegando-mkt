import {apiFailure,ApiError,privateHeaders,requireMember} from '@/lib/server/workspace-api';
import {isManager} from '@/lib/workspace';
export async function GET(request:Request) {
  try {
    const {supabase,snapshot}=await requireMember();
    if(!isManager(snapshot.member.role)) throw new ApiError(403,'Auditoria exige gestão.');
    const raw=new URL(request.url).searchParams.get('before');
    if(raw!==null && !/^\d{1,15}$/.test(raw)) throw new ApiError(400,'Página inválida.');
    const result=await supabase.rpc('agency_audit_page',{p_before:raw ? Number(raw) : null,p_limit:50});
    if(result.error) throw new ApiError(503,'Não foi possível consultar a auditoria.');
    return Response.json({entries:result.data},{headers:privateHeaders});
  } catch(error) {return apiFailure(error);}
}
