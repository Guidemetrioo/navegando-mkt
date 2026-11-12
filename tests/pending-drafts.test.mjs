import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);require('./load-ts.cjs');
const {readPendingDrafts,archivePendingDrafts,makePendingDraft}=require('../src/lib/pending-drafts.ts');
function storage(){const map=new Map();return {get length(){return map.size;},key:i=>[...map.keys()][i]??null,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
test('tabs retain independent drafts and another user cannot see them',()=>{
 const s=storage();s.setItem('navegando-pending:u:tab1','first');s.setItem('navegando-pending:u:tab2','second');s.setItem('navegando-pending:other:tab1','private');s.setItem('navegando-pending:u','legacy');
 assert.equal(readPendingDrafts(s,'u').length,3);assert.equal(readPendingDrafts(s,'u','navegando-pending:u:tab1').length,2);
 s.removeItem('navegando-pending:u:tab1');assert.equal(s.getItem('navegando-pending:u:tab2'),'second');
});
test('reload archives originals rather than discarding them',()=>{
 const s=storage();s.setItem('navegando-pending:u:a','contents');archivePendingDrafts(s,readPendingDrafts(s,'u'));assert.equal(s.getItem('navegando-archived:u:a'),'contents');assert.equal(readPendingDrafts(s,'u').length,0);
});
test('quota failure during archival leaves original recoverable',()=>{
 const s=storage();s.setItem('navegando-pending:u:a','contents');s.setItem=()=>{throw new Error('quota');};assert.throws(()=>archivePendingDrafts(s,readPendingDrafts(s,'u')));assert.equal(s.getItem('navegando-pending:u:a'),'contents');
});

test('recovery payload retains changed evidence and request ID without copying unchanged history',()=>{
 const {emptyWorkspace}=require('../src/lib/workspace.ts');const base={member:{user_id:'u'},records:[{kind:'clients',id:'old',revision:1,data:{id:'old',nome:'Old',large:'x'.repeat(100000)}}]};
 const latest=emptyWorkspace();latest.clients.push(base.records[0].data);latest.pontos.push({id:'photo',foto_url:'data:image/jpeg;base64,evidence'});
 const batch={requestId:'stable-id',changes:[{kind:'pontos',id:'photo',expected:0,data:latest.pontos[0]}],sent:latest};
 const draft=makePendingDraft(base,latest,batch);assert.equal(draft.changes[0].data.foto_url,latest.pontos[0].foto_url);assert.equal(draft.request.requestId,'stable-id');assert(!JSON.stringify(draft).includes('xxxxx'));assert.equal(draft.request.sent,undefined);
});
