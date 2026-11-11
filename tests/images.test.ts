import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imagePlacement, defaultSettings, boundedSize, validateDimensions } from '../src/services/imageLayout.ts';

for (const [sw, sh, width, height] of [[900,1600,1920,1080], [1920,1080,1080,1350]]) {
  for (const mode of ['contain', 'cover', 'adapt'] as const) {
    test(`${sw}x${sh} → ${width}x${height}, ${mode}: escala uniforme e limites`, () => {
      const p = imagePlacement(sw,sh,width,height,mode);
      assert.ok(Math.abs(p.width / p.height - sw / sh) < 1e-10);
      assert.ok(Math.abs(p.width / sw - p.height / sh) < 1e-10);
      if (mode === 'cover') { assert.ok(p.width >= width); assert.ok(p.height >= height); }
      else { assert.ok(p.width <= width); assert.ok(p.height <= height); }
      assert.ok(Math.abs(p.x * 2 + p.width - width) < 1e-8);
      assert.ok(Math.abs(p.y * 2 + p.height - height) < 1e-8);
    });
  }
}
test('recorte acompanha posição e limita seus extremos', () => {
  const left = imagePlacement(1600,900,1080,1350,'cover',0,50);
  const right = imagePlacement(1600,900,1080,1350,'cover',100,50);
  assert.ok(Math.abs(left.x) < 1e-8); assert.equal(right.x + right.width,1080);
  assert.deepEqual(imagePlacement(1600,900,1080,1350,'cover',-50,200),imagePlacement(1600,900,1080,1350,'cover',0,100));
});
test('dimensões inválidas e limites de memória', () => {
  for (const [w,h] of [[0,100],[1.5,100],[Infinity,100],[NaN,20],[8193,1],[5000,5000],[-1,100]]) assert.throws(()=>validateDimensions(w,h));
  validateDimensions(1920,1080); validateDimensions(4000,4000);
  for (const [w,h] of [[10000,4000],[1,40000],[6000,6000]]) {
    const safe = boundedSize(w,h);
    assert.ok(safe.width <= 8192 && safe.height <= 8192 && safe.width * safe.height <= 16_000_000);
    validateDimensions(safe.width,safe.height);
  }
  assert.equal(defaultSettings(900,1600).mode,'contain');
  assert.equal(defaultSettings(900,1600).background,'transparent');
});
