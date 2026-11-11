import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePassword, unitPrice, textStats, passwordEntropy } from '../src/services/tools.ts';
test('contagem de texto vazio, linhas e unicode', () => {
 assert.deepEqual(textStats(''), {words:0,characters:0,lines:0});
 assert.deepEqual(textStats('Olá  mundo\n🙂'), {words:3,characters:12,lines:2});
});
test('preço normaliza massa e volume', () => {
 assert.equal(unitPrice({price:10,quantity:500,unit:'g'}),20);
 assert.equal(unitPrice({price:20,quantity:1,unit:'kg'}),20);
 assert.equal(unitPrice({price:3,quantity:250,unit:'ml'}),12);
 assert.equal(unitPrice({price:4,quantity:2,unit:'un'}),2);
});
test('senhas incluem todos os grupos escolhidos e respeitam o tamanho', () => {
 for (const numbers of [false,true]) for (const symbols of [false,true]) for (const length of [8,20,64]) {
  for(let i=0;i<25;i++) {
   const p=generatePassword(length,numbers,symbols);
   assert.equal(p.length,length); assert.match(p,/[a-z]/); assert.match(p,/[A-Z]/);
   assert.equal(/[0-9]/.test(p),numbers); assert.equal(/[^a-zA-Z0-9]/.test(p),symbols);
  }
 }
 assert.throws(()=>generatePassword(0,true,true));
 assert.throws(()=>generatePassword(8.5,true,true));
 assert.ok(passwordEntropy(20,true,true)>100);
});
