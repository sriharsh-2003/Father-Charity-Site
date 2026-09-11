/*
  Drives two things:
  1. The full "pray for him" flow on pray.html: pick a verse (or random),
     optionally add a name and a message, submit to /api/prayers.
  2. The scrolling prayers feed, rendered from /api/prayers, shared between
     pray.html and the home page (index.html only calls renderPrayersFeed,
     it doesn't need the picker/form).

  Requires assets/data/verses.js (CURATED_VERSES) to be loaded first.
*/

let SELECTED_VERSE = null; // { key, label } or { key: "random", label }

function pickRandomVerse() {
  const v = CURATED_VERSES[Math.floor(Math.random() * CURATED_VERSES.length)];
  return v;
}

function verseLabel(verse) {
  const lang = currentLang();
  return lang === "ar" ? verse.label_ar : verse.label_en;
}

function initVersePicker() {
  const container = document.getElementById("verse-picker");
  if (!container) return;

  const lang = currentLang();
  const buttons = CURATED_VERSES.map(
    (v) => `<button type="button" class="btn btn--secondary btn--sm" data-verse-key="${v.key}">${verseLabel(v)}</button>`
  );
  buttons.push(
    `<button type="button" class="btn btn--secondary btn--sm" data-verse-key="random">${lang === "ar" ? "اختيار عشوائي" : "Random"}</button>`
  );
  container.innerHTML = buttons.join("");

  container.querySelectorAll("[data-verse-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("[data-verse-key]").forEach((b) => b.classList.remove("btn--primary"));
      container.querySelectorAll("[data-verse-key]").forEach((b) => b.classList.add("btn--secondary"));
      btn.classList.remove("btn--secondary");
      btn.classList.add("btn--primary");

      const key = btn.dataset.verseKey;
      if (key === "random") {
        const random = pickRandomVerse();
        SELECTED_VERSE = { key: "random", label: verseLabel(random), url: random.url };
      } else {
        const match = CURATED_VERSES.find((v) => v.key === key);
        SELECTED_VERSE = { key, label: verseLabel(match), url: match.url };
      }

      const linkEl = document.getElementById("verse-open-link");
      if (linkEl) {
        linkEl.href = SELECTED_VERSE.url;
        linkEl.hidden = false;
      }
      const formSection = document.getElementById("prayer-form-section");
      if (formSection) formSection.hidden = false;
    });
  });
}

async function submitPrayer(e) {
  e.preventDefault();
  const statusEl = document.getElementById("prayer-form-status");
  const submitBtn = document.getElementById("prayer-submit");

  if (!SELECTED_VERSE) return;

  const name = document.getElementById("prayer-name").value;
  const message = document.getElementById("prayer-message").value;

  submitBtn.disabled = true;
  statusEl.textContent = t().testimonySubmitting;

  try {
    const res = await fetch("/api/prayers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message, verse: SELECTED_VERSE.key }),
    });

    if (res.status === 429) {
      statusEl.textContent = t().testimonyRateLimited;
    } else if (res.status === 409) {
      statusEl.textContent = t().testimonyDuplicate;
    } else if (!res.ok) {
      statusEl.textContent = t().testimonyError;
    } else {
      statusEl.textContent = t().testimonySuccess;
      document.getElementById("prayer-form").reset();
      loadPrayersFeed("prayers-feed");
    }
  } catch (err) {
    statusEl.textContent = t().testimonyError;
  } finally {
    submitBtn.disabled = false;
  }
}

function renderPrayersFeed(containerId, prayers) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const countEl = document.getElementById(containerId + "-count");
  const lang = currentLang();

  if (countEl) countEl.textContent = t().testimonyCount(prayers.length);

  if (prayers.length === 0) {
    container.innerHTML = `<p class="results-empty">${t().testimonyEmpty}</p>`;
    return;
  }

  container.innerHTML = prayers
    .slice(0, 30)
    .map((item) => {
      const name = escapeHtml(item.name) || t().testimonyAnonymous;
      const message = item.message ? escapeHtml(item.message) : "";
      const verseEntry = CURATED_VERSES.find((v) => v.key === item.verse);
      const verseText = item.verse
        ? escapeHtml(verseEntry ? (lang === "ar" ? verseEntry.label_ar : verseEntry.label_en) : item.verse)
        : "";
      return `
        <article class="prayer-card">
          ${verseText ? `<p class="prayer-card__verse">${verseText}</p>` : ""}
          ${message ? `<p class="prayer-card__message">${message}</p>` : ""}
          <p class="prayer-card__name">${name}</p>
        </article>`;
    })
    .join("");
}

async function loadPrayersFeed(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<p class="results-loading">${t().testimonyLoading}</p>`;
  try {
    const res = await fetch("/api/prayers");
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    renderPrayersFeed(containerId, data.prayers || []);
  } catch (err) {
    container.innerHTML = `<p class="results-empty">${t().testimonyError}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initVersePicker();

  const form = document.getElementById("prayer-form");
  if (form) form.addEventListener("submit", submitPrayer);

  document.querySelectorAll("[data-prayers-feed]").forEach((el) => loadPrayersFeed(el.id));
});

document.addEventListener("langchange", () => {
  initVersePicker();
  document.querySelectorAll("[data-prayers-feed]").forEach((el) => loadPrayersFeed(el.id));
});
