import test from 'node:test';import assert from 'node:assert/strict';import {randomBytes} from 'node:crypto';
import {encryptBackup,decryptBackup,verifyBundle,sha256} from '../scripts/backup-codec.mjs';
const key=randomBytes(32).toString('base64');
const bytes=Buffer.from('evidence-test');
const bundle={version:1,createdAt:new Date().toISOString(),tables:{agency_members:[],agency_records:[{id:'x'}],agency_audit:[],agency_requests:[]},files:[{path:'test.jpg',base64:bytes.toString('base64'),sha256:sha256(bytes)}]};
test('encrypted backup round trip preserves all tables and binary files',()=>{const encrypted=encryptBackup(bundle,key);assert(!encrypted.includes(Buffer.from('evidence-test')));const restored=decryptBackup(encrypted,key);assert.deepEqual(restored,bundle);assert.equal(verifyBundle(restored).files,1);});
test('wrong encryption key cannot recover a backup',()=>{assert.throws(()=>decryptBackup(encryptBackup(bundle,key),randomBytes(32).toString('base64')));});
test('modified backup is rejected instead of partially restored',()=>{const data=encryptBackup(bundle,key);data[data.length-1]^=1;assert.throws(()=>decryptBackup(data,key));});
test('missing tables and corrupted files are rejected',()=>{assert.throws(()=>verifyBundle({...bundle,tables:{}}));assert.throws(()=>verifyBundle({...bundle,files:[{...bundle.files[0],sha256:'wrong'}]}));});
