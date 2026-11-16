import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const run=mode=>JSON.parse(execFileSync(process.execPath,['-e',`require('./tests/load-ts.cjs');const {verifyCredentials}=require('./src/lib/auth-users.ts');console.log(JSON.stringify({email:verifyCredentials('alexandre@navegando.com','alexandre123').valid,username:verifyCredentials('alexandre','alexandre123').valid,wrong:verifyCredentials('alexandre@navegando.com','incorrect').valid,otherDomain:verifyCredentials('alexandre@example.com','alexandre123').valid}));`],{cwd:new URL('..',import.meta.url),env:{...process.env,NEXT_PUBLIC_APP_MODE:mode},encoding:'utf8'}));
test('demo accepts Alexandre username or team email without accepting other domains or wrong passwords',()=>{assert.deepEqual(run('demo'),{email:true,username:true,wrong:false,otherDomain:false});});
test('production never accepts demo credentials, including team email',()=>{assert.deepEqual(run('production'),{email:false,username:false,wrong:false,otherDomain:false});});
