/*
  Homepage "impact so far" stats: prayers ("blessings"), SAR donated, and
  shares. Each number comes from wherever it already genuinely lives on
  the site, rather than a new tracked total invented just for this
  section:
    - Blessings:  /api/prayers, the same real shared count the prayers
                  feed and pray.html already use (array length = count).
    - Donations:  DONATION_CAMPAIGN.raisedAmount from
                  assets/data/donation.js, the same figure the donate
                  page's own progress bar shows. Manually updated there
                  until a payment gateway exists to total it for real.
    - Shares:     /api/shares, a new minimal counter (see that file),
                  incremented by assets/js/share.js on every completed
                  share.
  If a number can't be loaded (no backend configured, or genuinely zero),
  it shows 0 rather than an error or a blank dash, this is a "how much
  has this resonated" section, not a critical form, a quiet 0 is the
  right failure mode.
*/

function formatStatNumber(n) {
  return Math.round(n).toLocaleString("en-US");
}

function animateStatValue(el, to) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced || to <= 0) {
    el.textContent = formatStatNumber(to);
    return;
  }
  const durationMs = 900;
  const start = performance.now();
  function step(now) {
    const progress = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatStatNumber(to * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.querySelector("[data-site-stats]");
  if (!wrap) return;

  const blessingsEl = wrap.querySelector("[data-stat-blessings]");
  const donationsEl = wrap.querySelector("[data-stat-donations]");
  const sharesEl = wrap.querySelector("[data-stat-shares]");

  if (donationsEl && typeof DONATION_CAMPAIGN !== "undefined") {
    animateStatValue(donationsEl, DONATION_CAMPAIGN.raisedAmount || 0);
  } else if (donationsEl) {
    donationsEl.textContent = "0";
  }

  if (blessingsEl) {
    fetch("/api/prayers")
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => animateStatValue(blessingsEl, data.count || (data.prayers || []).length))
      .catch(() => { blessingsEl.textContent = "0"; });
  }

  if (sharesEl) {
    fetch("/api/shares")
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => animateStatValue(sharesEl, data.count || 0))
      .catch(() => { sharesEl.textContent = "0"; });
  }
});
