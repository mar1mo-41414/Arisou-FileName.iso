'use strict';
const $ = selector => document.querySelector(selector);
const form = $('#generator-form');
const list = $('#result-list');
let filenames = [];
let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 2200);
}
async function copy(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const input = document.createElement('textarea');
      input.value = text;
      input.style.position = 'fixed'; input.style.opacity = '0';
      document.body.appendChild(input); input.select();
      const success = document.execCommand('copy'); input.remove();
      if (!success) throw new Error('copy failed');
    }
    toast('コピーしました！');
  } catch (_) { toast('コピーできませんでした。テキストを選択してコピーしてください。'); }
}
function render() {
  list.replaceChildren();
  filenames.forEach((filename, index) => {
    const row = document.createElement('button'); row.type = 'button'; row.className = 'file-row';
    row.setAttribute('aria-label', `${filename} をコピー`);
    const number = document.createElement('span'); number.className = 'file-number'; number.textContent = String(index + 1).padStart(2, '0');
    const icon = document.createElement('span'); icon.className = 'file-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = '▤';
    const name = document.createElement('span'); name.className = 'file-name'; name.textContent = filename;
    const copyIcon = document.createElement('span'); copyIcon.className = 'copy-icon'; copyIcon.setAttribute('aria-hidden', 'true'); copyIcon.textContent = '⧉';
    row.append(number, icon, name, copyIcon); row.addEventListener('click', () => copy(filename)); list.append(row);
  });
  $('#result-count').textContent = `${filenames.length} FILES`;
  $('#copy-all').disabled = !filenames.length;
}
function generate() {
  try {
    const values = {
      category: $('#category').value,
      chars: [...document.querySelectorAll('input[name="chars"]:checked')].map(el => el.value),
      nameMin: Number($('#name-min').value), nameMax: Number($('#name-max').value),
      extMin: Number($('#ext-min').value), extMax: Number($('#ext-max').value),
      extMode: document.querySelector('input[name="ext-mode"]:checked').value,
      fixedExt: $('#fixed-ext').value, dos: $('#dos').checked, tilde: $('#tilde').checked,
      count: Number($('#count').value)
    };
    filenames = Arisou.generate(values);
    $('#error').hidden = true; render();
  } catch (error) { $('#error').textContent = error.message; $('#error').hidden = false; }
}
form.addEventListener('submit', event => { event.preventDefault(); generate(); });
document.querySelectorAll('input[name="ext-mode"]').forEach(input => input.addEventListener('change', () => {
  const mode = document.querySelector('input[name="ext-mode"]:checked').value;
  $('#fixed-wrap').hidden = mode !== 'fixed';
  $('#ext-min').disabled = $('#ext-max').disabled = mode === 'fixed';
  $('#ext-hint').textContent = mode === 'fixed' ? '入力した拡張子をそのまま使用します（8.3形式では大文字・3文字以内）。文字種・文字数の設定は適用されません。' : mode === 'random' ? '選んだ文字と文字数で、存在しない拡張子も作ります。' : '種類に合う拡張子から、文字数と文字種に合うものを選びます。';
}));
$('#copy-all').addEventListener('click', () => copy(filenames.join('\n')));
generate();
