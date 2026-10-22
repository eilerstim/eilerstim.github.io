// Theme follows the system preference. ?theme=light|dark forces one (used for previews and screenshots).
export function initTheme() {
  const wanted = new URLSearchParams(location.search).get('theme');
  if (wanted === 'light' || wanted === 'dark') document.documentElement.dataset.theme = wanted;
}
