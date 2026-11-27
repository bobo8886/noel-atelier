// A print-resolution spread. The mounted photograph always retains its entire frame.
const serif = '"Songti SC", "Noto Serif CJK SC", SimSun, Georgia, serif';
const caption = 'italic 500 65px Cormorant, Georgia, serif';

function postmark(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(-.15);
  ctx.strokeStyle = '#aa7567'; ctx.fillStyle = '#916b60'; ctx.lineWidth = 1.8;
  for (const r of [48, 43]) {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.textAlign = 'center'; ctx.font = '14px Georgia, serif'; ctx.fillText('NOËL', 0, -13);
  ctx.font = 'italic 500 23px Cormorant, Georgia, serif'; ctx.fillText('25 XII', 0, 14);
  for (const y of [-10, 1, 12]) {
    ctx.beginPath(); ctx.moveTo(-119, y);
    ctx.bezierCurveTo(-100, y - 12, -80, y + 14, -63, y);
    ctx.quadraticCurveTo(-52, y - 6, -43, y - 2); ctx.stroke();
  }
  ctx.restore();
}

function mountPhoto(ctx, photo, width, height) {
  const mountH = Math.min(height - 88, 965), mountY = Math.min(66, (height - mountH) / 2);
  ctx.save(); ctx.translate(30 + width / 2, mountY + mountH / 2); ctx.rotate(-.025);
  const board = ctx.createLinearGradient(-width / 2, -mountH / 2, width / 2, mountH / 2);
  board.addColorStop(0, '#36584a'); board.addColorStop(1, '#172f2b');
  ctx.shadowColor = '#59483055'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 7;
  ctx.fillStyle = board; ctx.fillRect(-width / 2, -mountH / 2, width, mountH);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#bca47688'; ctx.lineWidth = 1.6;
  ctx.strokeRect(-width / 2 + 15, -mountH / 2 + 15, width - 30, mountH - 30);
  const w = width - 120, h = w * photo.height / photo.width;
  ctx.translate(0, -28); ctx.rotate(.01);
  ctx.shadowColor = '#071b16aa'; ctx.shadowBlur = 19; ctx.shadowOffsetY = 9;
  ctx.fillStyle = '#faf2da'; ctx.fillRect(-w / 2 - 14, -h / 2 - 14, w + 28, h + 89);
  ctx.shadowColor = 'transparent';
  ctx.drawImage(photo, -w / 2, -h / 2, w, h);
  const corners = [[-w / 2 - 14, -h / 2 - 14, 1], [w / 2 + 14, h / 2 + 75, -1]];
  for (const [x, y, side] of corners) {
    const gold = ctx.createLinearGradient(x, y, x + 26 * side, y + 26 * side);
    gold.addColorStop(0, '#6f5b35'); gold.addColorStop(.57, '#ccb480'); gold.addColorStop(1, '#80663e');
    ctx.fillStyle = gold; ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + 37 * side, y); ctx.lineTo(x, y + 37 * side); ctx.fill();
  }
  ctx.fillStyle = '#8b5047'; ctx.textAlign = 'center'; ctx.font = caption;
  ctx.fillText('Merry Christmas', 0, h / 2 + 53, w - 45);
  ctx.restore();
}

export function renderLetterPrint(ctx, photo, {salutation, body, memory, signature, heading}, wrap) {
  const paper = ctx.canvas;
  const left = 1012, right = 1845, content = right - left;
  const textFont = '37px ' + serif, noteFont = '29px ' + serif;
  ctx.font = textFont;
  const paragraphs = wrap(ctx, body, content);
  ctx.font = noteFont;
  const wish = memory ? wrap(ctx, memory, content - 26) : [];
  const lineStep = 58, wishStep = 44;
  const linesHeight = paragraphs.length * lineStep;
  const messageHeight = 200 + linesHeight + (wish.length ? 46 + wish.length * wishStep : 0);
  paper.height = Math.max(1080, messageHeight + 420);
  const height = paper.height, width = paper.width;
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#cbbb94'); bg.addColorStop(.5, '#ede2c5'); bg.addColorStop(1, '#cabc9d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  mountPhoto(ctx, photo, 865, height);

  ctx.shadowColor = '#6a573e49'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
  const stock = ctx.createLinearGradient(914, 0, width, height);
  stock.addColorStop(0, '#f5ead0'); stock.addColorStop(.62, '#fff6df'); stock.addColorStop(1, '#f3e6cb');
  ctx.fillStyle = stock; ctx.fillRect(913, 32, width - 943, height - 64);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#c4af855e'; ctx.lineWidth = 1; ctx.strokeRect(931.5, 51.5, width - 980, height - 103);
  const foldY = Math.round(height * .54);
  const crease = ctx.createLinearGradient(0, foldY - 7, 0, foldY + 9);
  crease.addColorStop(0, '#ae986700'); crease.addColorStop(.48, '#ae986719'); crease.addColorStop(.52, '#ffffff59'); crease.addColorStop(1, '#fff9ee00');
  ctx.fillStyle = crease; ctx.fillRect(914, foldY - 7, width - 945, 16);

  ctx.fillStyle = '#365348'; ctx.textAlign = 'left';
  ctx.font = '500 56px Cormorant, Georgia, serif'; ctx.fillText('Noël Atelier', left, 163);
  postmark(ctx, right - 45, 159);
  ctx.strokeStyle = '#b69a67'; ctx.beginPath(); ctx.moveTo(left, 221); ctx.lineTo(right, 221); ctx.stroke();
  ctx.textAlign = 'right'; ctx.font = '24px ' + serif; ctx.fillStyle = '#846d4d'; ctx.fillText(heading, right, 268);
  ctx.textAlign = 'left';
  const top = 296 + Math.max(0, (height - 440 - messageHeight) * .3);
  ctx.fillStyle = '#284b3e'; ctx.font = '600 41px ' + serif;
  ctx.fillText(salutation, left, top + 37, content);
  let baseline = top + 72;
  ctx.font = textFont; ctx.fillStyle = '#39483e';
  for (const line of paragraphs) {
    baseline += lineStep;
    ctx.strokeStyle = '#b9a98956'; ctx.beginPath(); ctx.moveTo(left, baseline + 12); ctx.lineTo(right, baseline + 12); ctx.stroke();
    ctx.fillText(line, left, baseline);
  }
  baseline += 112;
  ctx.textAlign = 'right'; ctx.fillStyle = '#6a4a3d';
  ctx.font = 'italic 500 45px Cormorant, ' + serif;
  ctx.fillText(signature, right, baseline, content);
  if (wish.length) {
    ctx.textAlign = 'left';
    baseline += 40;
    ctx.fillStyle = '#aa8a5c'; ctx.fillRect(left, baseline + 15, 2, wish.length * wishStep);
    ctx.fillStyle = '#745456'; ctx.font = noteFont;
    for (const line of wish) { baseline += wishStep; ctx.fillText(line, left + 22, baseline); }
  }
}
