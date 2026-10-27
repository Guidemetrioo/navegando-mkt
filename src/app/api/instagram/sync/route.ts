export async function POST() {
  return Response.json({error:'Integração com Instagram ainda não configurada. Nenhuma sincronização foi executada.'},{status:501,headers:{'Cache-Control':'no-store'}});
}
