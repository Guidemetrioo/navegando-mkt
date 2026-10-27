export async function GET() { return Response.json({error:'Webhook não configurado.'},{status:501}); }
export async function POST() { return Response.json({error:'Webhook não configurado. Nenhum evento foi aceito.'},{status:501}); }
