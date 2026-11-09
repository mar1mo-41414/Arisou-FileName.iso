const test = require('node:test');
const assert = require('node:assert/strict');
const { generate } = require('../generator');
const defaults = { category: 'image', chars: ['lower', 'upper', 'number', 'symbol'], nameMin: 6, nameMax: 12, extMin: 2, extMax: 4, extMode: 'category', fixedExt: '', dos: false, tilde: false, count: 20 };
const run = overrides => generate({ ...defaults, ...overrides });
test('category extension and length constraints', () => {
  for (const filename of run({})) { const [name, ext] = filename.split('.'); assert.ok(name.length >= 6 && name.length <= 12); assert.ok(['jpg', 'jpeg', 'png', 'gif', 'tiff', 'webp', 'bmp'].includes(ext)); }
});
test('random extension uses chosen characters and exact lengths', () => {
  for (const filename of run({ chars: ['number'], nameMin: 4, nameMax: 4, extMode: 'random', extMin: 5, extMax: 5 })) assert.match(filename, /^\d{4}\.\d{5}$/);
});
test('fixed extension is exact and ignores extension lengths and characters', () => {
  for (const filename of run({ chars: ['number'], extMode: 'fixed', fixedExt: '.png', extMin: 9, extMax: 2 })) assert.match(filename, /^\d+\.png$/);
});
test('8.3 and tilde together', () => {
  for (const filename of run({ dos: true, tilde: true, extMode: 'random' })) assert.match(filename, /^[A-Z0-9_-]{0,6}~1\.[A-Z0-9_-]{2,3}$/);
});
test('8.3 fixed extension uppercases and rejects too long', () => {
  assert.match(run({ dos: true, extMode: 'fixed', fixedExt: 'jpg' })[0], /\.JPG$/);
  assert.throws(() => run({ dos: true, extMode: 'fixed', fixedExt: 'tiff' }));
});
test('invalid or impossible conditions report errors', () => {
  assert.throws(() => run({ chars: [] }));
  assert.throws(() => run({ category: 'image', chars: ['number'], extMode: 'category' }));
  assert.throws(() => run({ dos: true, nameMin: 9, nameMax: 12 }));
  assert.throws(() => run({ tilde: true, nameMin: 1, nameMax: 1 }));
  assert.throws(() => run({ extMode: 'fixed', fixedExt: '' }));
});
