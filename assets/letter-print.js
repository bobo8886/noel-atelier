// A print-resolution spread. The mounted photograph always retains its entire frame.
const caption = 'italic 500 65px Cormorant, Georgia, serif';

function printerSeal(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y); ctx.strokeStyle = '#64786a'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-67,0); ctx.lineTo(-33,0); ctx.moveTo(33,0); ctx.lineTo(67,0); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 23, 28, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.lineJoin = 'round'; ctx.lineWidth = 2.3;
  ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(-7,-3); ctx.lineTo(-3,-4);
  ctx.lineTo(-11,8); ctx.lineTo(-1,8); ctx.lineTo(-1,14); ctx.lineTo(1,14);
  ctx.lineTo(1,8); ctx.lineTo(11,8); ctx.lineTo(3,-4); ctx.lineTo(7,-3);
  ctx.closePath(); ctx.stroke();
  ctx.restore();
}

function mountPhoto(ctx, photo, width, height) {
  const mountH = Math.min(height - 88, 965), mountY = Math.min(66, (height - mountH) / 2);
  ctx.save(); ctx.translate(30 + width / 2, mountY + mountH / 2); ctx.rotate(-.012);
  const board = ctx.createLinearGradient(-width / 2, -mountH / 2, width / 2, mountH / 2);
  board.addColorStop(0, '#36584a'); board.addColorStop(1, '#172f2b');
  ctx.shadowColor = '#59483055'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 7;
  ctx.fillStyle = board; ctx.fillRect(-width / 2, -mountH / 2, width, mountH);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#653e44'; ctx.fillRect(width / 2 - 23, -mountH / 2, 23, mountH);
  ctx.strokeStyle = '#bca47688'; ctx.lineWidth = 1.6;
  ctx.strokeRect(-width / 2 + 15, -mountH / 2 + 15, width - 30, mountH - 30);
  const w = width - 120, h = w * photo.height / photo.width;
  ctx.translate(0, -28); ctx.rotate(.01);
  ctx.shadowColor = '#071b16aa'; ctx.shadowBlur = 19; ctx.shadowOffsetY = 9;
  ctx.fillStyle = '#faf2da'; ctx.fillRect(-w / 2 - 14, -h / 2 - 14, w + 28, h + 89);
  ctx.shadowColor = 'transparent';
  ctx.drawImage(photo, -w / 2, -h / 2, w, h);
  ctx.fillStyle = '#724651'; ctx.textAlign = 'left'; ctx.font = caption;
  const title = 'Merry Christmas', inset = -w / 2 + 10, baseline = h / 2 + 55;
  ctx.fillText(title, inset, baseline);
  ctx.strokeStyle = '#baac99'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(inset + ctx.measureText(title).width + 22, baseline - 16);
  ctx.lineTo(w / 2 - 12, baseline - 16); ctx.stroke();
  ctx.restore();
}

export function renderLetterPrint(ctx, photo, {salutation, body, memory, signature, heading}, wrap) {
  const paper = ctx.canvas;
  const left = 1010, right = 1838, content = right - left, center = (left + right) / 2;
  const styles = getComputedStyle(document.documentElement);
  const reading = styles.getPropertyValue('--letter-reading').trim();
  const hand = styles.getPropertyValue('--letter-hand').trim();
  const chinese = document.documentElement.lang.startsWith('zh');
  const textFont = '36px ' + reading, noteFont = '28px ' + reading;
  ctx.font = textFont;
  const paragraphs = body.split('\n').map(paragraph => wrap(ctx, paragraph, content));
  ctx.font = noteFont;
  const wish = memory ? wrap(ctx, memory, content) : [];
  const lineStep = chinese ? 65 : 58, paragraphGap = 20, wishStep = 44;
  const linesHeight = paragraphs.reduce((total, lines) => total + lines.length * lineStep, 0)
    + (paragraphs.length - 1) * paragraphGap;
  paper.height = Math.max(1080, 628 + linesHeight + (wish.length ? 57 + wish.length * wishStep : 0));
  const height = paper.height, width = paper.width;
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#cbbb94'); bg.addColorStop(.5, '#ede2c5'); bg.addColorStop(1, '#cabc9d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  mountPhoto(ctx, photo, 865, height);

  ctx.shadowColor = '#6a573e49'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
  const stock = ctx.createLinearGradient(914, 0, width, height);
  stock.addColorStop(0, '#f4ecdf'); stock.addColorStop(.62, '#fffaf1'); stock.addColorStop(1, '#f8efe2');
  ctx.fillStyle = stock; ctx.fillRect(913, 32, width - 943, height - 64);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#c4af855e'; ctx.lineWidth = 1; ctx.strokeRect(931.5, 51.5, width - 980, height - 103);
  const foldY = Math.round(height * .54);
  const crease = ctx.createLinearGradient(0, foldY - 7, 0, foldY + 9);
  crease.addColorStop(0, '#ae986700'); crease.addColorStop(.48, '#ae986719'); crease.addColorStop(.52, '#ffffff59'); crease.addColorStop(1, '#fff9ee00');
  ctx.fillStyle = crease; ctx.fillRect(914, foldY - 7, width - 945, 16);

  printerSeal(ctx, center, 111);
  ctx.fillStyle = '#2a473d'; ctx.textAlign = 'center';
  ctx.font = '600 76px Cormorant, Georgia, serif'; ctx.fillText('Noël Atelier', center, 220);
  ctx.textAlign = 'right'; ctx.font = '26px ' + reading; ctx.fillStyle = '#70685e'; ctx.fillText(heading, right, 277);
  ctx.strokeStyle = '#c5b9a5'; ctx.beginPath(); ctx.moveTo(left, 304); ctx.lineTo(right, 304); ctx.stroke();
  const top = 362;
  ctx.textAlign = 'left'; ctx.fillStyle = '#274438'; ctx.font = '400 ' + (chinese ? '52px ' : '62px ') + hand;
  ctx.fillText(salutation, left, top + 32, content);
  let baseline = top + 67;
  ctx.font = textFont; ctx.fillStyle = '#343d34';
  for (const [index, lines] of paragraphs.entries()) {
    if (index) baseline += paragraphGap;
    for (const line of lines) {
      baseline += lineStep; ctx.fillText(line, left, baseline);
    }
  }
  baseline += 100;
  ctx.textAlign = 'right'; ctx.fillStyle = '#70414c';
  ctx.font = /\p{Script=Han}/u.test(signature) ? '400 46px ' + hand : 'italic 500 50px Cormorant, Georgia, serif';
  const signatureWidth = Math.min(content, ctx.measureText(signature).width);
  if (signatureWidth + 50 < content) {
    ctx.strokeStyle = '#956f74'; ctx.beginPath(); ctx.moveTo(right - signatureWidth - 48, baseline - 13);
    ctx.lineTo(right - signatureWidth - 17, baseline - 13); ctx.stroke();
  }
  ctx.fillText(signature, right, baseline, content);
  if (wish.length) {
    ctx.textAlign = 'left';
    baseline += 40;
    ctx.fillStyle = '#c5b9a5'; ctx.fillRect(left, baseline + 3, 60, 1.5);
    ctx.fillStyle = '#6c5b55'; ctx.font = noteFont;
    for (const line of wish) { baseline += wishStep; ctx.fillText(line, left, baseline); }
  }
}
