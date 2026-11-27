import {t} from './i18n.js';

const maxLetters = 32;
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh', {granularity: 'grapheme'}) : null;

function limitNote(value) {
  const line = value.replace(/[\r\n\u2028\u2029]+/gu, ' ');
  const parts = segmenter ? segmenter.segment(line) : line;
  let count = 0;
  let text = '';
  for (const part of parts) {
    if (count === maxLetters) break;
    text += segmenter ? part.segment : part;
    count++;
  }
  return {text, count};
}

function drawStar(ctx, x, y, size, alpha) {
  if (!alpha) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3.1);
  glow.addColorStop(0, 'rgba(255,232,190,.8)');
  glow.addColorStop(.17, 'rgba(254,202,154,.33)');
  glow.addColorStop(1, 'rgba(239,157,158,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-size * 3.1, -size * 3.1, size * 6.2, size * 6.2);
  ctx.rotate(.14);
  ctx.fillStyle = '#fff2d2';
  ctx.beginPath();
  ctx.moveTo(0, -size * 1.35);
  ctx.quadraticCurveTo(size * .10, -size * .1, size, 0);
  ctx.quadraticCurveTo(size * .1, size * .1, 0, size * 1.35);
  ctx.quadraticCurveTo(-size * .1, size * .1, -size, 0);
  ctx.quadraticCurveTo(-size * .1, -size * .1, 0, -size * 1.35);
  ctx.fill();
  ctx.restore();
}

function createFlight(experience) {
  const sky = document.createElement('div');
  sky.className = 'wish-note-sky';
  sky.hidden = true;
  sky.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  const caption = document.createElement('p');
  caption.className = 'wish-note-caption';
  sky.append(canvas, caption);
  experience.append(sky);
  const ctx = canvas.getContext('2d');
  const gentle = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let timeout = 0;

  function clear() {
    cancelAnimationFrame(frame);
    clearTimeout(timeout);
    sky.hidden = true;
    caption.textContent = '';
    if (canvas.width > 1) canvas.width = canvas.height = 1;
  }

  function fly(text) {
    clear();
    sky.hidden = false;
    caption.textContent = text;
    caption.style.opacity = '0';
    const sparks = Array.from({length: 48}, () => ({
      at: Math.random() * .99,
      offset: Math.random() * 2 - 1,
      drift: Math.random() - .5,
      size: .45 + Math.random() * .9,
      tone: Math.random() > .62 ? '#f4beb7' : '#ffdfa7'
    }));
    const start = performance.now();

    function paint(now) {
      const elapsed = Math.max(0, (now - start) / 1000);
      const still = gentle.matches || !ctx;
      const width = sky.clientWidth;
      const height = sky.clientHeight;
      const portrait = width / Math.max(height, 1) <= 1.2;
      const endX = portrait ? .5 : .745;
      const endY = portrait ? Math.max(.107, Math.min(.164, .263 - (caption.offsetHeight + 22) / Math.max(height, 1))) : .315;
      const p = still ? 1 : Math.min(1, elapsed / 1.55);
      const head = 1 - (1 - p) ** 1.5;
      const fade = still ? 1 : Math.max(0, Math.min(1, (6.8 - elapsed) / .8));
      const reveal = still ? 1 : Math.min(1, Math.max(0, (elapsed - 1.45) / .48));
      caption.style.left = endX * 100 + '%';
      caption.style.top = 'calc(' + endY * 100 + '% + 13px)';
      caption.style.opacity = String(reveal * fade);

      // Separate entrance tangents give each aspect ratio a gentle S-shaped flight.
      function point(t) {
        const s = 1 - t;
        return {
          x: width * (s ** 3 * .49 + 3 * s * s * t * (portrait ? .82 : .74) +
              3 * s * t * t * (portrait ? .24 : .60) + t ** 3 * endX),
          y: height * (s ** 3 * .73 + 3 * s * s * t * .61 + 3 * s * t * t * (endY + .10) + t ** 3 * endY)
        };
      }
      if (ctx) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const pixels = Math.round(width * dpr);
        const rows = Math.round(height * dpr);
        if (canvas.width !== pixels || canvas.height !== rows) {
          canvas.width = pixels;
          canvas.height = rows;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        const tailLength = Math.max(0, .26 - Math.max(0, elapsed - 1.46) * .34);
        if (!still && tailLength > 0) {
          const from = Math.max(0, head - tailLength);
          const fromPoint = point(from);
          const toPoint = point(head);
          if (head > from) {
            const gradient = ctx.createLinearGradient(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y);
            gradient.addColorStop(0, 'rgba(224,151,151,0)');
            gradient.addColorStop(.45, 'rgba(239,174,167,.4)');
            gradient.addColorStop(1, 'rgba(255,236,185,.95)');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            for (let i = 0; i <= 28; i++) {
              const drop = point(from + (head - from) * i / 28);
              if (i === 0) ctx.moveTo(drop.x, drop.y);
              else ctx.lineTo(drop.x, drop.y);
            }
            ctx.stroke();
          }
        }
        if (!still && elapsed < 2.8) {
          for (const spark of sparks) {
            const birth = (1 - (1 - spark.at) ** (2 / 3)) * 1.55;
            const age = elapsed - birth;
            if (age < 0 || age >= 1.2) continue;
            const position = point(spark.at);
            ctx.globalAlpha = (1 - age / 1.2) ** 1.65 * .78;
            ctx.fillStyle = spark.tone;
            ctx.beginPath();
            ctx.arc(position.x + spark.offset * (1 + age * 18), position.y + age * age * (12 + spark.drift * 10),
              spark.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        const tip = point(head);
        const landing = still ? 0 : Math.exp(-(((elapsed - 1.55) / .23) ** 2)) * 4;
        drawStar(ctx, tip.x, tip.y, (portrait ? 7.2 : 8.5) + landing, fade);
      }
      if (still) timeout = setTimeout(clear, 5600);
      else if (elapsed >= 2.8 && elapsed < 6) timeout = setTimeout(() => { frame = requestAnimationFrame(paint); }, (6 - elapsed) * 1000);
      else if (elapsed < 6.8) frame = requestAnimationFrame(paint);
      else clear();
    }
    paint(start);
  }
  return {fly, clear};
}

export function createWishNote({onSend}) {
  const experience = document.getElementById('experience');
  const guide = document.getElementById('guide-toggle');
  const actions = document.createElement('div');
  actions.className = 'wish-note-actions';
  const entry = document.createElement('button');
  entry.type = 'button';
  entry.className = 'wish-note-entry';
  entry.hidden = true;
  entry.setAttribute('aria-controls', 'wish-note-dialog');
  entry.setAttribute('aria-haspopup', 'dialog');
  entry.setAttribute('aria-expanded', 'false');
  entry.innerHTML = '<i class="icon wish" aria-hidden="true"></i><span></span>';
  const entryLabel = entry.lastElementChild;
  guide.before(actions);
  actions.append(entry, guide);

  const dialog = document.createElement('dialog');
  dialog.id = 'wish-note-dialog';
  dialog.className = 'wish-note-panel';
  dialog.setAttribute('aria-labelledby', 'wish-note-title');
  dialog.innerHTML = `
    <form autocomplete="off">
      <h2 id="wish-note-title"><i class="icon wish" aria-hidden="true"></i><span></span></h2>
      <button type="button" class="language-switch dialog-language" data-language-switch></button>
      <button type="button" class="wish-note-close"><i class="icon cross" aria-hidden="true"></i></button>
      <label for="wish-note-input"></label>
      <input id="wish-note-input" type="text" enterkeyhint="send" aria-describedby="wish-note-help" required>
      <p class="wish-note-help"><span id="wish-note-help"></span><span class="wish-note-count" aria-hidden="true">0 / 32</span></p>
      <button type="submit" class="gold-button wish-note-submit" disabled><span></span><i class="icon wish" aria-hidden="true"></i></button>
    </form>`;
  const announcement = document.createElement('div');
  announcement.className = 'wish-note-announcement';
  announcement.setAttribute('role', 'status');
  experience.append(dialog, announcement);
  const flight = createFlight(experience);
  const input = dialog.querySelector('input');
  const submit = dialog.querySelector('[type="submit"]');
  const count = dialog.querySelector('.wish-note-count');
  let saved = '';
  let active = false;
  let composing = false;
  let lastCompositionEnd = -Infinity;

  function localize() {
    entryLabel.textContent = saved ? t('改写心愿', 'Edit your wish') : t('写下心愿', 'Write a wish');
    dialog.querySelector('h2 span').textContent = t('写一颗心愿星', 'Wish on a star');
    dialog.querySelector('.wish-note-close').setAttribute('aria-label', t('关闭心愿纸', 'Close wish'));
    dialog.querySelector('label').textContent = t('你的心愿', 'Your wish');
    input.placeholder = t('愿我们明年还一起看雪。', 'Let’s watch the snow again.');
    dialog.querySelector('#wish-note-help').textContent = t('最多 32 个字，送出后出现在夜空中。', 'Up to 32 characters. Your words will appear in the sky.');
    submit.querySelector('span').textContent = t('送进夜空', 'Send into the sky');
  }
  localize();
  window.addEventListener('gift-languagechange', () => {
    localize();
    if (announcement.textContent) announcement.textContent = t('心愿星已升起。', 'Your wishing star has risen. ') + saved;
  });
  function refresh() {
    const limited = limitNote(input.value);
    if (input.value !== limited.text) input.value = limited.text;
    count.textContent = limited.count + ' / ' + maxLetters;
    submit.disabled = !limited.text.trim();
  }
  function close() {
    if (dialog.open) dialog.close();
    entry.setAttribute('aria-expanded', 'false');
    composing = false;
  }
  entry.addEventListener('click', () => {
    if (!active || dialog.open) return;
    flight.clear();
    input.value = saved;
    refresh();
    entry.setAttribute('aria-expanded', 'true');
    dialog.showModal();
    input.focus({preventScroll: true});
    input.setSelectionRange(input.value.length, input.value.length);
  });
  dialog.querySelector('.wish-note-close').addEventListener('click', close);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  dialog.addEventListener('close', () => {
    entry.setAttribute('aria-expanded', String(dialog.open));
    composing = false;
  });
  dialog.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'Enter' && !composing && !event.isComposing && event.keyCode !== 229 && performance.now() - lastCompositionEnd < 45) {
      event.preventDefault();
    }
  });
  dialog.addEventListener('keyup', event => event.stopPropagation());
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => {
    composing = false;
    lastCompositionEnd = performance.now();
    refresh();
  });
  input.addEventListener('input', event => { if (!composing && !event.isComposing) refresh(); });
  dialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    if (!active || !dialog.open || composing) return;
    refresh();
    if (submit.disabled) return;
    saved = input.value.trim();
    close();
    localize();
    flight.fly(saved);
    announcement.textContent = t('心愿星已升起。', 'Your wishing star has risen. ') + saved;
    onSend(saved);
  });
  function setActive(next) {
    if (active === Boolean(next)) return;
    active = Boolean(next);
    entry.hidden = !active;
    if (!active) {
      close();
      flight.clear();
    }
  }
  function reset() {
    setActive(false);
    saved = '';
    input.value = '';
    refresh();
    announcement.textContent = '';
    localize();
  }
  return {setActive, reset, get value() { return saved; }, get editing() { return dialog.open; }};
}
