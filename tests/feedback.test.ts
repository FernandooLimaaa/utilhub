import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feedback } from '../src/config/feedback.ts';

test('feedback usa somente os links públicos informados e navegação por hash', () => {
  const publicUrl = new URL(feedback.publicUrl), embedded = new URL(feedback.embeddedUrl);
  assert.equal(publicUrl.protocol, 'https:');
  assert.equal(publicUrl.hostname, 'docs.google.com');
  assert.equal(publicUrl.pathname, '/forms/d/e/1FAIpQLSfYL5E-pi6tiI4PFca90GJ9pwOndmtvsmdvNyy4o96D35_khA/viewform');
  assert.equal(publicUrl.search, '');
  assert.equal(embedded.origin + embedded.pathname, feedback.publicUrl);
  assert.equal(embedded.search, '?embedded=true');
  assert.ok(!feedback.publicUrl.includes('/edit'));
  assert.equal(feedback.route, '#/feedback');
});
