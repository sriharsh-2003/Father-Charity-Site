/*
  Renders the donation progress bar + counter from assets/data/donation.js,
  and drives the donation form below it (amount selection, validation, and
  a submit handler ready to POST to a real gateway the moment the client
  provides one -- see the apiEndpoint comment in donation.js).
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

/* ---------------------------------------------------------------------- */
/* Donation form                                                          */
/* ---------------------------------------------------------------------- */

let SELECTED_AMOUNT = null;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("donation-form");
  if (!form || typeof DONATION_CAMPAIGN === "undefined") return;

  const presetsWrap = form.querySelector("[data-amount-presets]");
  const customInput = document.getElementById("donation-amount-custom");
  const statusEl = document.getElementById("donation-form-status");

  const { presetAmounts, currencySymbolAr, currencySymbolEn } = DONATION_CAMPAIGN;

  function buildPresetButtons() {
    presetsWrap.innerHTML = "";
    (presetAmounts || []).forEach((amount) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "donation-form__amount-btn";
      btn.dataset.amount = String(amount);
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = formatAmountLabel(amount);
      btn.addEventListener("click", () => selectPreset(amount, btn));
      presetsWrap.appendChild(btn);
    });
  }

  function formatAmountLabel(amount) {
    const symbol = currentLang() === "ar" ? currencySymbolAr : currencySymbolEn;
    const num = formatNumber(amount);
    return currentLang() === "ar" ? `${num} ${symbol}` : `${symbol} ${num}`;
  }

  function selectPreset(amount, btn) {
    SELECTED_AMOUNT = amount;
    customInput.value = "";
    presetsWrap.querySelectorAll(".donation-form__amount-btn").forEach((b) => {
      b.setAttribute("aria-pressed", String(b === btn));
    });
  }

  customInput.addEventListener("input", () => {
    SELECTED_AMOUNT = null;
    presetsWrap.querySelectorAll(".donation-form__amount-btn").forEach((b) => {
      b.setAttribute("aria-pressed", "false");
    });
  });

  function applyPlaceholder() {
    const attr = currentLang() === "ar" ? "data-i18n-placeholder-ar" : "data-i18n-placeholder-en";
    customInput.placeholder = customInput.getAttribute(attr) || "";
  }

  buildPresetButtons();
  applyPlaceholder();

  document.addEventListener("langchange", () => {
    buildPresetButtons();
    applyPlaceholder();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const customValue = parseFloat(customInput.value);
    const amount = SELECTED_AMOUNT || (Number.isFinite(customValue) && customValue > 0 ? customValue : null);

    if (!amount) {
      statusEl.textContent = t().donationInvalidAmount;
      return;
    }

    const payload = {
      amount,
      currency: DONATION_CAMPAIGN.currency,
      name: document.getElementById("donation-name").value.trim(),
      email: document.getElementById("donation-email").value.trim(),
    };

    if (!DONATION_CAMPAIGN.apiEndpoint) {
      // No gateway wired up yet (see the apiEndpoint comment in
      // donation.js). The form itself, validation included, is fully
      // live -- this is the one line that changes once the client's API
      // is in place: swap this block for the fetch() below.
      statusEl.textContent = t().donationPendingGateway;
      return;
    }

    statusEl.textContent = t().donationSubmitting;
    const submitBtn = document.getElementById("donation-submit");
    submitBtn.disabled = true;

    fetch(DONATION_CAMPAIGN.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Gateway request failed");
        return response.json();
      })
      .then((data) => {
        // Expected shape once a real gateway is connected: a redirect URL
        // to the hosted payment page. Adjust this to match whatever the
        // client's gateway actually returns.
        if (data && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      })
      .catch(() => {
        statusEl.textContent = t().donationGatewayError;
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  });
});
