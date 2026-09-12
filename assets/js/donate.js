/*
  Renders the donation progress bar + counter from assets/data/donation.js.
  Pure front-end display, no payment processing (see the comment at the top
  of donation.js for why).
*/
document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.querySelector("[data-donation-progress]");
  if (!wrap || typeof DONATION_CAMPAIGN === "undefined") return;

  const { targetAmount, raisedAmount, currencySymbolAr, currencySymbolEn } = DONATION_CAMPAIGN;
  const pct = targetAmount > 0
    ? Math.min(100, Math.round((raisedAmount / targetAmount) * 100))
    : 0;

  const bar = wrap.querySelector("[data-donation-bar]");
  const pctLabel = wrap.querySelector("[data-donation-pct]");
  const raisedLabelAr = wrap.querySelector("[data-donation-raised-ar]");
  const raisedLabelEn = wrap.querySelector("[data-donation-raised-en]");
  const targetLabelAr = wrap.querySelector("[data-donation-target-ar]");
  const targetLabelEn = wrap.querySelector("[data-donation-target-en]");
  const bar_container = wrap.querySelector("[role='progressbar']");

  if (targetLabelAr) targetLabelAr.textContent = `${formatNumber(targetAmount)} ${currencySymbolAr}`;
  if (targetLabelEn) targetLabelEn.textContent = `${currencySymbolEn} ${formatNumber(targetAmount)}`;
  if (pctLabel) pctLabel.textContent = `${pct}%`;
  if (bar_container) {
    bar_container.setAttribute("aria-valuenow", String(pct));
    bar_container.setAttribute("aria-valuemin", "0");
    bar_container.setAttribute("aria-valuemax", "100");
  }

  // Animate the bar filling in and the raised number counting up, once it
  // actually scrolls into view rather than immediately on load.
  const animate = () => {
    if (bar) requestAnimationFrame(() => { bar.style.width = pct + "%"; });
    countUp(0, raisedAmount, 1200, (value) => {
      if (raisedLabelAr) raisedLabelAr.textContent = `${formatNumber(value)} ${currencySymbolAr}`;
      if (raisedLabelEn) raisedLabelEn.textContent = `${currencySymbolEn} ${formatNumber(value)}`;
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(wrap);
  } else {
    animate();
  }
});

function formatNumber(n) {
  return Math.round(n).toLocaleString("en-US");
}

function countUp(from, to, durationMs, onTick) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    onTick(to);
    return;
  }
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / durationMs);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    onTick(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
