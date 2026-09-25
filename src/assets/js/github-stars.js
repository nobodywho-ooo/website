(() => {
  const badges = [...document.querySelectorAll('[data-github-stars]')];
  if (!badges.length) return;

  const cacheKey = 'nobodywho-github-stars';
  const maxAge = 60 * 60 * 1000;

  function show(count) {
    const formatted = new Intl.NumberFormat('en-US').format(count);
    badges.forEach(badge => {
      badge.querySelector('[data-star-count]').textContent = formatted;
      badge.hidden = false;
      badge.closest('a').setAttribute('aria-label', `Nobodywho on GitHub, ${formatted} stars`);
    });
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (Number.isInteger(cached?.count) && cached.count >= 0 && Date.now() - cached.savedAt < maxAge) {
      show(cached.count);
      return;
    }
  } catch { /* Storage may be unavailable. */ }

  async function fetchStars() {
    try {
      const response = await fetch('https://api.github.com/repos/nobodywho-ooo/nobodywho');
      if (!response.ok) return;
      const { stargazers_count: count } = await response.json();
      if (!Number.isInteger(count) || count < 0) return;
      show(count);
      try { localStorage.setItem(cacheKey, JSON.stringify({ count, savedAt: Date.now() })); } catch { /* Storage may be unavailable. */ }
    } catch { /* Keep the GitHub link without a count if the API is unavailable. */ }
  }

  if ('requestIdleCallback' in window) requestIdleCallback(fetchStars, { timeout: 2000 });
  else window.addEventListener('load', fetchStars, { once: true });
})();
