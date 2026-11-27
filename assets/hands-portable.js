import {t} from './i18n.js';

// The single-file edition handles input without camera permission or model files.
export function createHands({onCancel}) {
  document.body.dataset.portable = 'true';
  const guide = document.getElementById('guide');
  const modes = [
    ['scatter', '星河', 'Galaxy', '移动鼠标或在树上滑动，牵引星流。', 'Move your pointer or swipe across the tree to guide the stars.'],
    ['gather', '亮灯', 'Lights', '轻点亮灯，让灯火沿树枝逐层攀升。', 'Tap to send warm light up through the branches.'],
    ['snow', '飘雪', 'Snow', '唤起冬雪，左右移动指尖或鼠标改变风向。', 'Bring on the snow. Move left or right to steer the wind.'],
    ['wish', '许愿', 'Wish', '在树上长按蓄光，松手放飞愿望。', 'Press and hold the tree to gather light. Release to send a wish.']
  ];
  guide.querySelectorAll('p').forEach(row => row.remove());
  const help = guide.querySelector('small');
  const rows = modes.map(([effect]) => {
    const row = document.createElement('p');
    const label = document.createElement('b');
    const body = document.createElement('span');
    row.append(label, ' ', body); help.before(row);
    return {label, body, button: document.querySelector('[data-effect="' + effect + '"]')};
  });
  function localize() {
    modes.forEach(([, name, en, description, detail], i) => {
      const {label, body, button} = rows[i];
      label.textContent = t(name, en);
      body.textContent = button.title = t(description, detail);
    });
    help.textContent = t('键盘可用 Tab 选择按钮，回车确认。在树上用左右键旋转，长按空格后松开许愿。',
      'Use Tab to select and Enter to activate. With the tree focused, use the arrow keys to turn it. Hold Space, then release to make a wish.');
    document.getElementById('guide-toggle').textContent = t('操作指南', 'How to play');
  }
  localize();
  window.addEventListener('gift-languagechange', localize);
  return {stop: onCancel};
}

