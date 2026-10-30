import { IS_DEMO } from '@/lib/app-mode';
import { apiFailure, requireMember, ApiError, privateHeaders } from '@/lib/server/workspace-api';
import { reverseStreet } from '@/lib/server/geocoding';
export async function GET(request:Request) {
  try {
    if(!IS_DEMO) await requireMember();
    const params=new URL(request.url).searchParams;
    const rawLat=params.get('lat'),rawLng=params.get('lng')||params.get('lon');
    const lat=Number(rawLat),lng=Number(rawLng);
    if(rawLat===null || rawLng===null || !Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180) throw new ApiError(400,'Coordenadas inválidas.');
    const result = await reverseStreet(lat,lng);
    return Response.json(result ? {success:true,...result} : {success:false,street:null,address:null,geocoding:process.env.GEOAPIFY_API_KEY ? 'unavailable' : 'not_configured'},{headers:privateHeaders});
  } catch(error) {return apiFailure(error);}
}
