import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);require('./load-ts.cjs');
test('missing cloud configuration never silently activates local mode',()=>{
  const old={mode:process.env.NEXT_PUBLIC_APP_MODE,url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY};
  try {
    delete process.env.NEXT_PUBLIC_APP_MODE;delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete require.cache[require.resolve('../src/lib/app-mode.ts')];
    const config=require('../src/lib/app-mode.ts');assert.equal(config.IS_DEMO,false);assert.equal(config.HAS_CLOUD_CONFIG,false);
  } finally {
    for(const [key,value] of [['NEXT_PUBLIC_APP_MODE',old.mode],['NEXT_PUBLIC_SUPABASE_URL',old.url],['NEXT_PUBLIC_SUPABASE_ANON_KEY',old.key]]) {
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
    delete require.cache[require.resolve('../src/lib/app-mode.ts')];
  }
});
test('street lookup requires a configured provider and never invents a road',async()=>{
  const {reverseStreet}=require('../src/lib/server/geocoding.ts');
  const key=process.env.GEOAPIFY_API_KEY,originalFetch=global.fetch;
  try {
    delete process.env.GEOAPIFY_API_KEY;
    global.fetch=()=>{throw new Error('Must not transmit GPS without configuration');};
    assert.equal(await reverseStreet(-23.5,-46.6),null);
    process.env.GEOAPIFY_API_KEY='test-only';
    global.fetch=async()=>Response.json({results:[{street:'Rua de teste',formatted:'Rua de teste, 10'}]});
    assert.deepEqual(await reverseStreet(-23.5,-46.6),{street:'Rua de teste',address:'Rua de teste, 10',provider:'geoapify'});
    global.fetch=async()=>Response.json({results:[{city:'São Paulo'}]});
    assert.equal(await reverseStreet(-23.51,-46.61),null);
  } finally {global.fetch=originalFetch;if(key===undefined)delete process.env.GEOAPIFY_API_KEY;else process.env.GEOAPIFY_API_KEY=key;}
});
