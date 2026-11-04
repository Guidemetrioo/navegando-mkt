import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);require('./load-ts.cjs');
const {validWhatsAppQr,validPairingCode,normalizeWhatsAppPhone,whatsappConnection}=require('../src/lib/whatsapp-connection.ts');
const qr=['TEST-REFERENCE'.repeat(5),'PUBLIC-KEY'.repeat(5),'IDENTITY'.repeat(5),'SECRET-FIXTURE'.repeat(4),'1'].join(',');
test('fabricated old QR and pairing placeholders are rejected',()=>{
  assert(!validWhatsAppQr('2@NavegandoMKT-WhatsApp-MultiDevice-Session-Auth-2026'));
  assert(!validWhatsAppQr('ABCDEFGH'));assert(!validPairingCode('NV84-29KT'));
  assert(validWhatsAppQr(qr));assert(validPairingCode('ABCD1234'));
});
test('only a backend-confirmed connection can become connected',()=>{
  assert.equal(whatsappConnection({online:true,status:'qr_ready',qrCode:qr}).conectado,false);
  assert.equal(whatsappConnection({online:false,status:'ready'}).conectado,false);
  const ready=whatsappConnection({online:true,status:'ready',qrCode:qr,pairingCode:'ABCD1234'});
  assert(ready.conectado);assert.equal(ready.qr_code,undefined);assert.equal(ready.pairing_code,undefined);
  const offline=whatsappConnection({});assert(!offline.conectado);assert.equal(offline.qr_code,undefined);
});
test('phone normalization includes country code even when the Brazilian DDD is 55',()=>{
  assert.equal(normalizeWhatsAppPhone('(11) 99999-1234'),'5511999991234');
  assert.equal(normalizeWhatsAppPhone('(55) 99999-1234'),'5555999991234');
  assert.equal(normalizeWhatsAppPhone('+55 11 99999-1234'),'5511999991234');
  assert.equal(normalizeWhatsAppPhone('123'),null);
});
test('QR rendering uses local encoding without contacting an image service',async()=>{
  const original=global.fetch;global.fetch=()=>{throw new Error('Network not allowed');};
  try {const image=await require('qrcode').toDataURL(qr);assert(image.startsWith('data:image/png;base64,'));}
  finally {global.fetch=original;}
});

// Isolated route tests: never connect a real phone, send a real message or start a bot.
class ApiError extends Error {constructor(status,message){super(message);this.status=status;}}
let role='gerente';
const apiPath=require.resolve('../src/lib/server/workspace-api.ts');
require.cache[apiPath]={id:apiPath,filename:apiPath,loaded:true,exports:{
  ApiError,privateHeaders:{'Cache-Control':'no-store'},
  requireMember:async()=>{if(role==='anonymous')throw new ApiError(401,'Login obrigatório.');return {snapshot:{member:{role}}};},
  checkOrigin:r=>{if(r.headers.get('origin')!==new URL(r.url).origin)throw new ApiError(403,'Origem inválida.');},
  readJson:r=>r.json(),apiFailure:e=>Response.json({error:e.message},{status:e.status||500}),
}};
const gateway=require('../src/lib/server/whatsapp-gateway.ts');
const route=require('../src/app/api/whatsapp/route.ts');
test('gateway refuses Vercel localhost and unprotected remote endpoints',()=>{
  const saved={url:process.env.WHATSAPP_BOT_URL,token:process.env.WHATSAPP_BOT_TOKEN,vercel:process.env.VERCEL};
  try {
    delete process.env.WHATSAPP_BOT_URL;assert.throws(gateway.whatsappGatewayConfig,/Configure/);
    process.env.WHATSAPP_BOT_URL='http://localhost:3001';process.env.VERCEL='1';assert.throws(gateway.whatsappGatewayConfig,/HTTPS|permanente/);
    delete process.env.VERCEL;process.env.WHATSAPP_BOT_URL='https://gateway.example.test';delete process.env.WHATSAPP_BOT_TOKEN;assert.throws(gateway.whatsappGatewayConfig,/autenticação/);
  } finally {for(const [k,v] of Object.entries({WHATSAPP_BOT_URL:saved.url,WHATSAPP_BOT_TOKEN:saved.token,VERCEL:saved.vercel})){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
test('rotated and expired QR state is handled without retaining an old code',()=>{
  assert.equal(gateway.publicWhatsAppStatus({status:'qr_ready',qrCode:qr},1000).qrCode,qr);
  assert.equal(gateway.publicWhatsAppStatus({status:'qr_ready',qrCode:qr},62000).qrCode,null);
  assert.equal(gateway.publicWhatsAppStatus({status:'ready',qrCode:qr}).qrCode,null);
});
test('WhatsApp route enforces login and manager role before contacting backend',async()=>{
  const original=global.fetch;global.fetch=()=>{throw new Error('Must not contact gateway');};
  try {role='anonymous';assert.equal((await route.GET()).status,401);role='interno';assert.equal((await route.GET()).status,403);}
  finally {role='gerente';global.fetch=original;}
});
test('pairing goes through authenticated server and preserves upstream failure',async()=>{
  const original=global.fetch,saved={url:process.env.WHATSAPP_BOT_URL,token:process.env.WHATSAPP_BOT_TOKEN,vercel:process.env.VERCEL};
  const request=body=>new Request('https://crm.example.test/api/whatsapp',{method:'POST',headers:{origin:'https://crm.example.test','Content-Type':'application/json'},body:JSON.stringify(body)});
  try {
    process.env.WHATSAPP_BOT_URL='https://gateway.example.test';process.env.WHATSAPP_BOT_TOKEN='test-only-token';
    let calls=0;
    global.fetch=async(url,init)=>{calls++;assert.equal(init.headers.Authorization,'Bearer test-only-token');assert.equal(JSON.parse(init.body).phoneNumber,'5555999991234');return Response.json({pairingCode:'ABCD1234'});};
    const success=await route.POST(request({action:'request-code',phoneNumber:'55999991234'}));assert.equal(success.status,200);assert.equal((await success.json()).pairingCode,'ABCD1234');assert.equal(calls,1);
    global.fetch=async()=>Response.json({error:'limited'},{status:429});assert.equal((await route.POST(request({action:'request-code',phoneNumber:'11999991234'}))).status,429);
    global.fetch=async()=>Response.json({pairingCode:'NV84-29KT'});assert.equal((await route.POST(request({action:'request-code',phoneNumber:'11999991234'}))).status,502);
    const wrongOrigin=new Request('https://crm.example.test/api/whatsapp',{method:'POST',headers:{origin:'https://other.example.test'},body:'{}'});assert.equal((await route.POST(wrongOrigin)).status,403);
  } finally {global.fetch=original;for(const [k,v] of Object.entries({WHATSAPP_BOT_URL:saved.url,WHATSAPP_BOT_TOKEN:saved.token,VERCEL:saved.vercel})){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
