import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);require('./load-ts.cjs');
const {isFilmmaker}=require('../src/lib/team-functions.ts');const {mayAccess}=require('../src/lib/workspace.ts');
test('a production manager can be scheduled as filmmaker without losing management permissions',()=>{const person={id:'lead',nome:'Lead',funcao:'gerente',funcoes_producao:['filmmaker'],ativo:true};assert.equal(isFilmmaker(person),true);assert.equal(mayAccess(person.funcao,'financeiro'),true);assert.equal(person.funcao,'gerente');});
test('production assignment never grants management authorization to a filmmaker',()=>{const person={id:'camera',nome:'Camera',funcao:'filmmaker',ativo:true};assert.equal(isFilmmaker(person),true);assert.equal(mayAccess(person.funcao,'financeiro'),false);});
test('ordinary managers and presenters are not classified as camera operators',()=>{assert.equal(isFilmmaker({funcao:'gerente'}),false);assert.equal(isFilmmaker({funcao:'modelo'}),false);assert.equal(isFilmmaker(undefined),false);});
