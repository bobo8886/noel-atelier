import {downloadGift} from './gift-export.js';
import {getLanguage, t} from './i18n.js';

const blessing = () => t('愿今夜落在你掌心的星光，也照亮你往后的每一个冬天。', 'May the starlight in your hands shine through every winter to come.');
const defaultSignature = 'With love, Noël';
const field = id => document.getElementById(id);
const greeting = name => name ? t('亲爱的' + name, 'Dear ' + name + ',') : t('圣诞快乐', 'For you, this Christmas');
const signature = name => name ? t('来自 ' + name, 'With love, ' + name) : defaultSignature;
const wishLine = wish => t('今晚的心愿 · ', 'Tonight’s wish · ') + wish;

function readGift() {
  const node = field('gift-message');
  let data;
  try { data = JSON.parse(node?.textContent || '{}'); } catch { data = {}; }
  const clean = (key, limit) => {
    if (typeof data?.[key] !== 'string') return '';
    const value = data[key].replace(/\r\n?/g, '\n').trim();
    return Array.from(key === 'message' ? value : value.replace(/\s+/g, ' ')).slice(0, limit).join('');
  };
  return {to: clean('to', 18), from: clean('from', 18), message: clean('message', 96)};
}

function bindDesk(gift) {
  const dialog = field('gift-desk'), form = field('gift-form');
  const to = field('gift-to'), from = field('gift-from'), words = field('gift-words');
  const seal = field('seal-gift'), status = field('desk-status');
  let busy = false, phase = 'ready', invalid = false;
  to.value = gift.from;
  from.value = gift.to;
  function localize() {
    words.placeholder = blessing();
    field('slip-name').textContent = to.value.trim() || t('给你', 'For you');
    to.setCustomValidity(invalid ? t('请写上收礼人的名字。', 'Enter the name of the person receiving this gift.') : '');
    const labels = {
      ready: t('封好并下载', 'Seal & download'),
      packing: t('正在装入礼物…', 'Wrapping your gift…'),
      done: t('再次下载', 'Download again'),
      failed: t('重新封装', 'Try again')
    };
    seal.lastElementChild.textContent = labels[phase];
    status.textContent = phase === 'done'
      ? t('礼物已封好。把下载的 HTML 文件发给' + to.value.trim() + '，用浏览器打开即可。',
          'Your gift is ready. Send the downloaded HTML file to ' + to.value.trim() + ' to open in a browser.')
      : phase === 'failed' ? t('下载未完成，请重试。', 'The download didn’t finish. Please try again.')
      : t('会生成一份 HTML 文件，对方打开就能拆礼物。', 'This makes an HTML file they can open to unwrap their gift.');
  }
  function update() {
    invalid = false;
    phase = busy ? 'packing' : 'ready';
    form.dataset.sealed = 'false';
    localize();
  }
  update();
  window.addEventListener('gift-languagechange', localize);
  form.addEventListener('input', update);
  to.addEventListener('invalid', () => { invalid = true; localize(); });
  function open() {
    if (dialog.open) return;
    dialog.showModal();
    to.focus({preventScroll: true});
  }
  field('write-gift').addEventListener('click', open);
  field('regift').addEventListener('click', open);
  field('desk-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (!to.value.trim()) {
      invalid = true;
      localize();
      to.reportValidity();
      return;
    }
    const note = {to: to.value.trim(), from: from.value.trim(), message: words.value.trim(), lang: getLanguage()};
    busy = true;
    seal.disabled = true;
    phase = 'packing'; localize();
    try {
      await downloadGift(note);
      if (note.to === to.value.trim() && note.from === from.value.trim() && note.message === words.value.trim()) {
        form.dataset.sealed = 'true';
        phase = 'done';
      } else phase = 'ready';
    } catch {
      phase = 'failed';
    } finally { busy = false; seal.disabled = false; localize(); }
  });
}

// Use exactly the same saved frame and wording for the on-screen and printed card.
function linesOf(ctx, text, maxWidth) {
  const lines = [];
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(getLanguage(), {granularity: 'word'}) : null;
  const glyphs = segmenter && new Intl.Segmenter(getLanguage(), {granularity: 'grapheme'});
  for (const paragraph of text.split('\n')) {
    const words = segmenter ? Array.from(segmenter.segment(paragraph), entry => entry.segment) : paragraph.match(/\s+|\S+/gu) || [];
    let line = '';
    for (const word of words) {
      if (line && ctx.measureText(line + word).width > maxWidth) {
        lines.push(line.trimEnd());
        line = '';
      }
      if (!line && !word.trim()) continue;
      if (ctx.measureText(word).width <= maxWidth) { line += word; continue; }
      for (const part of glyphs ? glyphs.segment(word) : word) {
        const glyph = glyphs ? part.segment : part;
        if (line && ctx.measureText(line + glyph).width > maxWidth) { lines.push(line); line = ''; }
        line += glyph;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

async function savePostcard(photo, gift, wish) {
  await document.fonts.ready;
  const paper = document.createElement('canvas');
  paper.width = 1500;
  const ctx = paper.getContext('2d');
  const serif = '"Songti SC", SimSun, Georgia, serif';
  const bodyFont = '33px ' + serif, wishFont = '28px ' + serif;
  ctx.font = bodyFont;
  const body = linesOf(ctx, gift.message || blessing(), 1280);
  ctx.font = wishFont;
  const memory = wish ? linesOf(ctx, wishLine(wish), 1260) : [];
  const fileName = 'Pour toi - ' + (gift.to || t('给你的圣诞礼物', 'Your Christmas gift')).replace(/[<>:"/\\|?*\x00-\x1f]/g, ' ') + '.png';
  const writingHeight = 231 + body.length * 46 + (memory.length ? 22 + memory.length * 40 : 0);
  // Extra-long, intentionally line-broken messages gain paper below the picture.
  paper.height = Math.max(1410, 860 + writingHeight);
  const photoH = Math.min(1050, paper.height - writingHeight - 58), photoW = photoH * 4 / 3;
  const x = (1500 - photoW) / 2, y = 42;
  ctx.fillStyle = '#f7efdf'; ctx.fillRect(0, 0, paper.width, paper.height);
  ctx.strokeStyle = '#ae9669'; ctx.lineWidth = 2; ctx.strokeRect(18, 18, paper.width - 36, paper.height - 36);
  ctx.fillStyle = '#fffbf0'; ctx.fillRect(x - 8, y - 8, photoW + 16, photoH + 16);
  ctx.strokeStyle = '#c3b394'; ctx.lineWidth = 1; ctx.strokeRect(x - 8, y - 8, photoW + 16, photoH + 16);
  ctx.drawImage(photo, x, y, photoW, photoH);
  let baseline = y + photoH + 85;
  ctx.textAlign = 'center'; ctx.fillStyle = '#934239';
  ctx.font = 'italic 500 78px Cormorant, Georgia, serif'; ctx.fillText('Merry Christmas', 750, baseline);
  baseline += 49;
  ctx.fillStyle = '#2d483d'; ctx.font = '600 32px ' + serif;
  ctx.fillText(greeting(gift.to), 750, baseline, 1280);
  ctx.font = bodyFont;
  for (const line of body) { baseline += 46; ctx.fillText(line, 750, baseline); }
  if (memory.length) {
    baseline += 18; ctx.fillStyle = '#784958'; ctx.font = wishFont;
    for (const line of memory) { baseline += 40; ctx.fillText(line, 750, baseline); }
  }
  ctx.fillStyle = '#556456'; ctx.font = gift.from ? '30px ' + serif : 'italic 500 39px Cormorant, Georgia, serif';
  ctx.fillText(signature(gift.from), 750, baseline + 62, 1280);
  const blob = await new Promise((resolve, reject) => paper.toBlob(b => b ? resolve(b) : reject(new Error('PNG')), 'image/png'));
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = fileName;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function createLetter() {
  const gift = readGift(), photo = field('card-photo'), ink = photo.getContext('2d');
  let wish = '', saveState = 'ready';
  const keep = field('keep'), label = keep.lastElementChild, block = field('card-wish');
  field('write-gift').hidden = Boolean(gift.to);
  function localize() {
    field('invitation').querySelector('p').textContent = gift.to
      ? t(gift.to + '，这份圣诞礼物送给你。', 'A Christmas gift for you, ' + gift.to + '.')
      : t('一份圣诞礼物，只为你。', 'A Christmas gift, just for you.');
    document.title = gift.to ? t('送给' + gift.to, 'For ' + gift.to) + ' · Pour toi' : t('Pour toi · 一份圣诞礼物', 'Pour toi · A Christmas gift');
    field('card-to').textContent = greeting(gift.to);
    field('card-body').textContent = gift.message || blessing();
    field('card-from').textContent = signature(gift.from);
    block.hidden = !wish;
    block.querySelector('span').textContent = wish ? wishLine(wish) : '';
    const labels = {
      ready: t('保存贺卡', 'Save postcard'), saving: t('正在装裱…', 'Preparing postcard…'),
      saved: t('再次保存贺卡', 'Save again'), failed: t('保存失败 · 重试', 'Try saving again')
    };
    label.textContent = labels[saveState];
  }
  localize();
  window.addEventListener('gift-languagechange', localize);
  bindDesk(gift);
  function remember(scene, value) {
    const frame = scene.capture();
    ink.drawImage(frame, 0, 0, photo.width, photo.height);
    wish = value;
    localize();
    field('letter').scrollTop = 0;
  }
  keep.addEventListener('click', async () => {
    if (keep.disabled) return;
    keep.disabled = true; saveState = 'saving'; localize();
    try { await savePostcard(photo, gift, wish); saveState = 'saved'; }
    catch { saveState = 'failed'; }
    finally { keep.disabled = false; localize(); }
  });
  function reset() {
    wish = '';
    saveState = 'ready';
    localize();
    ink.clearRect(0, 0, photo.width, photo.height);
  }
  return {recipient: gift.to, remember, reset};
}
