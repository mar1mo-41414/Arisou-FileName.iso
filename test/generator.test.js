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

test('parse extension set with BOM, CRLF, optional dot, whitespace and duplicates', () => {
  const { parseExtensionSet } = require('../generator');
  assert.deepEqual(parseExtensionSet('\uFEFF.jpg\r\n png \r\n\r\njpg\rWEBP\n'), ['jpg', 'png', 'jpg', 'WEBP']);
  assert.throws(() => parseExtensionSet(' \n\n'), /空/);
  assert.throws(() => parseExtensionSet('jpg\nfoo.bar'), /2行目/);
  assert.throws(() => parseExtensionSet('jpg\n.'), /2行目/);
});
test('set extensions are selected from matching entries', () => {
  const settings = { ...defaults, extMode: 'set', extensionSet: ['jpg', 'png', 'tiff'], count: 1 };
  assert.match(generate(settings, () => 0)[0], /\.jpg$/);
  assert.match(generate(settings, () => 0.999)[0], /\.tiff$/);
  for (const filename of run({ extMode: 'set', extensionSet: ['jpg', 'png', 'tiff'], extMin: 3, extMax: 3 })) assert.match(filename, /\.(jpg|png)$/);
});
test('set respects character and 8.3 constraints, and reports impossible conditions', () => {
  for (const filename of run({ extMode: 'set', extensionSet: ['jpg', 'tiff', 'png'], dos: true, chars: ['lower'] })) assert.match(filename, /\.(JPG|PNG)$/);
  assert.throws(() => run({ extMode: 'set', extensionSet: [] }), /ファイル/);
  assert.throws(() => run({ extMode: 'set', extensionSet: ['png'], chars: ['number'] }), /条件に合う/);
  assert.throws(() => run({ extMode: 'set', extensionSet: ['tiff'], dos: true }), /条件に合う/);
});

test('extension set file picker accepts each supported file suffix', () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  const input = html.match(/<input\b[^>]*id="extension-file"[^>]*>/);
  assert.ok(input, 'extension file input exists');
  const accept = input[0].match(/\baccept="([^"]+)"/);
  assert.ok(accept, 'file picker has an accept list');
  const types = accept[1].split(',').map(type => type.trim());
  for (const suffix of ['.txt', '.list', '.dic', '.dict', '.dicts']) assert.ok(types.includes(suffix), `${suffix} is accepted`);
});

test('each supported suffix is read as the same UTF-8 extension set', async () => {
  const { parseExtensionSet } = require('../generator');
  for (const suffix of ['txt', 'list', 'dic', 'dict', 'dicts']) {
    const file = new File(['jpg\n.png\n'], `extensions.${suffix}`);
    assert.deepEqual(parseExtensionSet(await file.text()), ['jpg', 'png']);
  }
});
