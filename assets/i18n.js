const preferenceKey = 'pour-toi-language';

function languageOf(value) {
  if (typeof value !== 'string') return null;
  const tag = value.trim().toLowerCase().split(/[-_]/)[0];
  return tag === 'zh' || tag === 'en' ? tag : null;
}

function initialLanguage() {
  const requested = languageOf(new URLSearchParams(globalThis.location?.search).get('lang'));
  if (requested) return requested;
  try {
    const gift = JSON.parse(globalThis.document?.getElementById('gift-message')?.textContent || '{}');
    const enclosed = languageOf(gift?.lang);
    if (enclosed) return enclosed;
  } catch { /* Older gifts may have no language tag. */ }
  try {
    const preference = languageOf(localStorage.getItem(preferenceKey));
    if (preference) return preference;
  } catch { /* Storage is optional, including for downloaded file URLs. */ }
  return languageOf(globalThis.navigator?.languages?.[0] || globalThis.navigator?.language) === 'zh' ? 'zh' : 'en';
}

let language = initialLanguage();
function updateDocument() {
  if (globalThis.document) document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
}
updateDocument();

export function getLanguage() { return language; }
export function t(zh, en) { return language === 'zh' ? zh : en; }

export function setLanguage(value) {
  const next = languageOf(value);
  if (!next) return;
  try { localStorage.setItem(preferenceKey, next); } catch { /* The choice still applies to this session. */ }
  if (next === language) return;
  language = next;
  updateDocument();
  try {
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', next);
      history.replaceState(history.state, '', url);
    }
  } catch { /* Some file URL contexts disallow history changes. */ }
  globalThis.window?.dispatchEvent(new CustomEvent('gift-languagechange', {detail: {language: next}}));
}
