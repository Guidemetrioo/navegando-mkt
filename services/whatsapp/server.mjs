import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';
import wwebjs from 'whatsapp-web.js';
const { Client, LocalAuth } = wwebjs;
const token = process.env.WHATSAPP_BOT_TOKEN || '';
if (token.length < 32) throw new Error('Configure WHATSAPP_BOT_TOKEN com pelo menos 32 caracteres aleatórios.');
const sessionPath = resolve(process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth');
let state = { status: 'connecting', qrCode: null, qrExpiresAt: 0, pairingCode: null, pairingExpiresAt: 0, phoneNumber: null };
let client;
let lastPair = 0;
let pairingBusy = false;
function clearAuth() { state.qrCode = null; state.qrExpiresAt = 0; state.pairingCode = null; state.pairingExpiresAt = 0; state.phoneNumber = null; }
function newClient() {
  const instance = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath }),
    authTimeoutMs: 60000,
    puppeteer: {
      headless: true,
      ...(process.env.CHROME_EXECUTABLE_PATH ? { executablePath: process.env.CHROME_EXECUTABLE_PATH } : {}),
      ...(process.env.CHROME_NO_SANDBOX === 'true' ? { args: ['--no-sandbox', '--disable-setuid-sandbox'] } : {}),
    },
  });
  instance.on('qr', qr => { state.status = 'qr_ready'; state.qrCode = qr; state.qrExpiresAt = Date.now() + 60000; state.pairingCode = null; });
  instance.on('code', code => {
    state.status = 'pairing'; state.pairingCode = code; state.pairingExpiresAt = Date.now() + 180000;
    state.qrCode = null; state.qrExpiresAt = 0;
  });
  instance.on('authenticated', () => { clearAuth(); state.status = 'authenticating'; });
  instance.on('ready', () => { clearAuth(); state.status = 'ready'; state.phoneNumber = instance.info?.wid?.user || null; });
  instance.on('auth_failure', () => { clearAuth(); state.status = 'auth_failure'; console.error('Falha de autenticação do WhatsApp.'); });
  instance.on('disconnected', () => { clearAuth(); state.status = 'disconnected'; });
  // No messages, reminders or automated replies are sent at startup or after pairing.
  return instance;
}
async function initialize() {
  client = newClient(); state.status = 'connecting';
  try { await client.initialize(); }
  catch (error) { clearAuth(); state.status = 'error'; console.error('Falha ao iniciar Chromium/WhatsApp:', String(error?.message || 'Erro desconhecido').split('\n')[0]); }
}
async function readBody(request) {
  let size = 0; const chunks = [];
  for await (const chunk of request) { size += chunk.length; if (size > 20000) throw new Error('body'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
function authorized(request) {
  const expected = Buffer.from(`Bearer ${token}`); const received = Buffer.from(request.headers.authorization || '');
  return expected.length === received.length && timingSafeEqual(expected, received);
}
const server = createServer(async (request, response) => {
  const send = (status, value) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); response.end(JSON.stringify(value)); };
  if (!authorized(request)) return send(401, { error: 'Não autorizado.' });
  const path = new URL(request.url, 'http://gateway.local').pathname;
  if (request.method === 'GET' && path === '/api/status') {
    return send(200, { ...state, qrCode: Date.now() < state.qrExpiresAt ? state.qrCode : null, pairingCode: Date.now() < state.pairingExpiresAt ? state.pairingCode : null });
  }
  if (request.method !== 'POST') return send(404, { error: 'Rota inexistente.' });
  let body;
  try { body = await readBody(request); } catch { return send(400, { error: 'Conteúdo inválido.' }); }
  try {
    if (path === '/api/request-code') {
      if (state.status === 'ready') return send(409, { error: 'WhatsApp já conectado.' });
      if (!client?.pupPage || !['qr_ready', 'pairing'].includes(state.status)) return send(409, { error: 'Aguarde a inicialização do WhatsApp.' });
      if (!/^[1-9]\d{10,14}$/.test(String(body.phoneNumber || ''))) return send(400, { error: 'Número internacional inválido.' });
      if (pairingBusy || Date.now() - lastPair < 30000) return send(429, { error: 'Aguarde antes de pedir outro código.' });
      lastPair = Date.now(); pairingBusy = true;
      try {
        const code = await client.requestPairingCode(body.phoneNumber);
        if (typeof code !== 'string' || !/^[A-Z0-9]{8}$/i.test(code.replace(/-/g, ''))) throw new Error('code');
        state.qrCode = null; state.qrExpiresAt = 0; state.pairingCode = code; state.pairingExpiresAt = Date.now() + 180000;
        return send(200, { success: true, pairingCode: code });
      } finally { pairingBusy = false; }
    }
    if (path === '/api/logout') {
      await client.logout(); await client.destroy().catch(() => {}); clearAuth();
      send(200, { success: true }); void initialize(); return;
    }
    if (path === '/api/send') {
      if (state.status !== 'ready') return send(409, { error: 'WhatsApp ainda não está pronto.' });
      if (!/^[1-9]\d{10,14}$/.test(String(body.phone || '')) || typeof body.message !== 'string' || !body.message.trim() || body.message.length > 4096) return send(400, { error: 'Mensagem ou destinatário inválidos.' });
      const message = await client.sendMessage(`${body.phone}@c.us`, body.message);
      return send(200, { success: true, messageId: message.id._serialized });
    }
    return send(404, { error: 'Rota inexistente.' });
  } catch { return send(502, { error: 'O WhatsApp não concluiu a operação. Aguarde e confira o estado da conexão.' }); }
});
server.requestTimeout = 20000;
server.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1', () => { console.log('Gateway WhatsApp ativo. Códigos de autenticação não são gravados no console.'); void initialize(); });
let closing = false;
async function close() { if (closing) return; closing = true; server.close(); await client?.destroy().catch(() => {}); process.exit(0); }
process.on('SIGINT', close); process.on('SIGTERM', close);
