/* Pure generation logic, also usable from Node for tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Arisou = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const categories = {
    game: { words: ['save', 'quest', 'player', 'world', 'level', 'dragon', 'map', 'stage', 'battle', 'slot'], extensions: ['sav', 'dat', 'pak', 'rom', 'bin'] },
    program: { words: ['setup', 'launch', 'install', 'update', 'system', 'client', 'boot', 'patch', 'app', 'core'], extensions: ['exe', 'app', 'sh', 'bat', 'dll', 'bin'] },
    video: { words: ['movie', 'clip', 'scene', 'render', 'final', 'record', 'capture', 'take', 'video'], extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
    image: { words: ['image', 'photo', 'scan', 'picture', 'cover', 'pixel', 'wallpaper', 'icon', 'img'], extensions: ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'webp', 'bmp'] },
    audio: { words: ['audio', 'track', 'sound', 'music', 'voice', 'mix', 'sample', 'loop', 'demo'], extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'] },
    data: { words: ['report', 'data', 'notes', 'backup', 'draft', 'list', 'export', 'document', 'config'], extensions: ['txt', 'csv', 'json', 'xml', 'pdf', 'doc', 'dat'] },
    archive: { words: ['archive', 'backup', 'package', 'files', 'bundle', 'release', 'assets', 'export'], extensions: ['zip', 'rar', '7z', 'tar', 'gz'] }
  };
  const pools = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', number: '0123456789', symbol: '_-' };
  const choose = (items, random) => items[Math.floor(random() * items.length)];
  const integer = (min, max, random) => min + Math.floor(random() * (max - min + 1));
  function parseExtensionSet(text) {
    const result = [];
    String(text).split(/\r\n|\n|\r/).forEach((line, index) => {
      const value = line.trim().replace(/^\./, '');
      if (!value) {
        if (line.trim()) throw new Error(`${index + 1}行目に拡張子がありません。`);
        return;
      }
      if (/[.\s/\\]/.test(value)) throw new Error(`${index + 1}行目の拡張子にドット・空白・スラッシュは使えません。`);
      result.push(value);
    });
    if (!result.length) throw new Error('拡張子セットが空です。1行に1つずつ拡張子を書いてください。');
    return result;
  }
  function generate(options, random = Math.random) {
    const { category, chars, extMode, fixedExt, dos, tilde, count } = options;
    if (!(category === 'all' || categories[category])) throw new Error('ファイルの種類を選んでください。');
    if (!Array.isArray(chars) || !chars.length || chars.some(c => !pools[c])) throw new Error('使用する文字を1つ以上選んでください。');
    if (!Number.isInteger(count) || count < 1 || count > 20) throw new Error('生成数は1〜20件にしてください。');
    const bounds = (min, max, limit, label) => {
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > limit || min > max) throw new Error(`${label}の文字数は1〜${limit}の範囲で、最小値を最大値以下にしてください。`);
    };
    bounds(options.nameMin, options.nameMax, 32, 'ファイル名');
    if (extMode !== 'fixed') bounds(options.extMin, options.extMax, 10, '拡張子');
    if (!['fixed', 'category', 'random', 'set'].includes(extMode)) throw new Error('拡張子の選び方を選んでください。');
    const nameMax = Math.min(options.nameMax, dos ? 8 : 32);
    const extMax = Math.min(options.extMax, dos ? 3 : 10);
    const nameMin = Math.max(options.nameMin, tilde ? 2 : 1);
    if (nameMin > nameMax) throw new Error('ルールに合うファイル名の文字数がありません。文字数を調整してください。');
    if (extMode !== 'fixed' && options.extMin > extMax) throw new Error('ルールに合う拡張子の文字数がありません。文字数を調整してください。');
    let pool = chars.map(c => pools[c]).join('');
    if (dos) pool = [...new Set(pool.toUpperCase())].join('');
    const allowed = c => pool.includes(c);
    const catalog = category === 'all' ? Object.values(categories) : [categories[category]];
    const words = catalog.flatMap(c => c.words).map(w => {
      if (dos || (!chars.includes('lower') && chars.includes('upper'))) return w.toUpperCase();
      return w;
    }).filter(w => [...w].every(allowed));
    let fixed = String(fixedExt || '').replace(/^\./, '');
    if (extMode === 'fixed') {
      if (!fixed || /[.\s/\\]/.test(fixed)) throw new Error('固定する拡張子を入力してください（ドット・空白・スラッシュは使えません）。');
      if (dos) {
        fixed = fixed.toUpperCase();
        if (fixed.length > 3 || !/^[A-Z0-9_$%'-@{}!#&()^`~]+$/.test(fixed)) throw new Error('8.3形式の固定拡張子は、使用できる半角文字で3文字以内にしてください。');
      }
    }
    const extensions = [...new Set(catalog.flatMap(c => c.extensions))].map(e => {
      if (dos || (!chars.includes('lower') && chars.includes('upper'))) return e.toUpperCase();
      return e;
    }).filter(e => e.length >= options.extMin && e.length <= extMax && [...e].every(allowed));
    if (extMode === 'category' && !extensions.length) throw new Error('条件に合う拡張子がありません。文字種・文字数またはファイルの種類を変更してください。');
    let setExtensions = [];
    if (extMode === 'set') {
      if (!Array.isArray(options.extensionSet) || !options.extensionSet.length) throw new Error('拡張子セットのファイルを選んでください。');
      setExtensions = options.extensionSet.map(e => dos ? e.toUpperCase() : e)
        .filter(e => e.length >= options.extMin && e.length <= extMax && [...e].every(allowed));
      if (!setExtensions.length) throw new Error('セットに条件に合う拡張子がありません。文字種・文字数または8.3形式を変更してください。');
    }
    function randomString(length) { return Array.from({ length }, () => choose(pool, random)).join(''); }
    function makeName() {
      const length = integer(nameMin, nameMax, random);
      const bodyLength = length - (tilde ? 2 : 0);
      let body = '';
      if (words.length && bodyLength) {
        body = choose(words, random).slice(0, bodyLength);
        if (body.length < bodyLength && chars.includes('symbol') && body.length + 1 < bodyLength) body += choose(['_', '-'], random);
      }
      body += randomString(bodyLength - body.length);
      return body + (tilde ? '~1' : '');
    }
    return Array.from({ length: count }, () => {
      const ext = extMode === 'fixed' ? fixed : extMode === 'category' ? choose(extensions, random) : extMode === 'set' ? choose(setExtensions, random) : randomString(integer(options.extMin, extMax, random));
      return `${makeName()}.${ext}`;
    });
  }
  return { generate, parseExtensionSet, categories };
});
