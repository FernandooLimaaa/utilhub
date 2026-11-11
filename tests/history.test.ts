import { test } from 'node:test';
import assert from 'node:assert/strict';
import { historyTransition } from '../src/services/history.ts';
import type { History } from '../src/services/history.ts';

test('histórico: desfazer, refazer e invalidar futuro após uma nova edição',()=>{
  let state:History<number>={past:[],present:0,future:[]};
  state=historyTransition(state,{type:'set',value:1});state=historyTransition(state,{type:'set',value:2});
  state=historyTransition(state,{type:'undo'});assert.equal(state.present,1);
  state=historyTransition(state,{type:'redo'});assert.equal(state.present,2);
  state=historyTransition(state,{type:'undo'});state=historyTransition(state,{type:'set',value:3});
  assert.deepEqual(state.future,[]);assert.equal(state.present,3);
});
test('histórico: um gesto contínuo vira uma única ação e há limite de memória',()=>{
  let state:History<number>={past:[],present:0,future:[]};
  for(let i=1;i<=10;i++)state=historyTransition(state,{type:'preview',value:i});
  state=historyTransition(state,{type:'commit',value:0});assert.equal(state.past.length,1);
  state=historyTransition(state,{type:'undo'});assert.equal(state.present,0);
  for(let i=1;i<=100;i++)state=historyTransition(state,{type:'set',value:i});
  assert.equal(state.past.length,40);
});
