import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url); require('./load-ts.cjs');
const Module=require('node:module');
let version=2, authError=null, user={id:'user-real'}, snapshotError=null, commitError=null;
let calls=[],uploads=0;
const snapshot={member:{user_id:'user-real',employee_id:'staff-real',role:'gerente'},records:[]};
const client={auth:{getUser:async()=>({data:{user},error:authError})},rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='agency_workspace_version') return {data:version};
  if(name==='agency_snapshot') return {data:snapshot,error:snapshotError};
  if(name==='agency_request_result') return {data:null};
  return {data:commitError?null:snapshot,error:commitError};
},storage:{from:()=>({upload:async()=>{uploads++;return {};}})}};
const original=Module._load;
Module._load=function(name,...rest){
  if(name==='@/lib/supabase/server') return {createClient:async()=>client};
  if(name==='@/lib/app-mode') return {IS_DEMO:false,HAS_CLOUD_CONFIG:true};
  if(name==='next/navigation') return {unstable_rethrow:()=>{}};
  if(name==='@/lib/server/geocoding') return {reverseStreet:async()=>null};
  if(name==='next/headers') return {cookies:async()=>({delete:()=>{}})};
  return original.call(this,name,...rest);
};
const {requireMember}=require('../src/lib/server/workspace-api.ts');
const workspace=require('../src/app/api/workspace/route.ts');
const legacy=require('../src/app/api/auth/team-session/route.ts');
Module._load=original;
function reset(){version=2;authError=null;user={id:'user-real'};snapshotError=null;commitError=null;calls=[];uploads=0;}
function request(changes,origin='https://agency.test'){return new Request('https://agency.test/api/workspace',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({requestId:'11111111-1111-4111-8111-111111111111',changes})});}
const clientChange={kind:'clients',id:'c-real',expected:0,data:{id:'c-real',nome:'Real'}};
test('production requires Supabase identity even if an old team cookie exists',async()=>{reset();user=null;await assert.rejects(requireMember(),e=>e.status===401);assert.equal(calls.length,0);});
test('an unlinked authenticated user receives 403, never a mock workspace',async()=>{reset();snapshotError={code:'42501'};await assert.rejects(requireMember(),e=>e.status===403);});
test('database outage never becomes a successful in-memory write',async()=>{reset();snapshotError={code:'08006'};const response=await workspace.POST(request([clientChange]));assert.equal(response.status,503);assert(!calls.some(c=>c.name.startsWith('agency_commit')));});
test('v2 rejects whole mixed batch containing bank hours instead of silently dropping it',async()=>{reset();const r=await workspace.POST(request([clientChange,{kind:'banco_horas',id:'b-real',expected:0,data:{id:'b-real',employee_id:'staff-real',data:'2026-11-13',tipo:'acrescimo_horas',minutos:30,motivo:'Ajuste conferido'}}]));assert.equal(r.status,503);assert.equal(uploads,0);assert(!calls.some(c=>c.name.startsWith('agency_commit')));});
test('v2 continues to persist supported records in the real database',async()=>{reset();const r=await workspace.POST(request([clientChange]));assert.equal(r.status,200);assert(calls.some(c=>c.name==='agency_commit'&&c.args.p_changes[0].id==='c-real'));});
test('v3 checks original request and commits through the fingerprint-protected RPC',async()=>{reset();version=3;const r=await workspace.POST(request([clientChange]));assert.equal(r.status,200);const checked=calls.find(c=>c.name==='agency_commit_checked');assert.match(checked.args.p_input_hash,/^[a-f0-9]{64}$/);assert(calls.some(c=>c.name==='agency_request_result'));});
test('failed database commit is never acknowledged as saved',async()=>{reset();commitError={code:'08006'};assert.equal((await workspace.POST(request([clientChange]))).status,503);});
test('cross-origin writes are rejected before database access',async()=>{reset();assert.equal((await workspace.POST(request([clientChange],'https://other.test'))).status,403);assert.equal(calls.length,0);});
test('legacy predictable-password endpoint cannot create a session',async()=>{reset();const r=await legacy.POST();assert.equal(r.status,410);assert.equal(r.headers.get('set-cookie'),null);});
