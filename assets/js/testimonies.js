/*
  Talks to /api/testimonies (see that file for the server side). This is the
  one page on the site that reads and writes real, visitor-submitted data,
  so everything rendered here goes through escapeHtml (from common.js)
  before it touches the DOM, since unlike the CSV files, this content isn't
  written by trusted staff.
*/

async function loadTestimonies() {
  const listEl = document.getElementById("testimonies-list");
  const countEl = document.getElementById("testimonies-count");
  listEl.innerHTML = `<p class="results-loading">${t().testimonyLoading}</p>`;

  try {
    const res = await fetch("/api/testimonies");
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    renderTestimonies(data.testimonies || []);
  } catch (err) {
    listEl.innerHTML = `<p class="results-empty">${t().testimonyError}</p>`;
    countEl.textContent = "";
  }
}

function renderTestimonies(items) {
  const listEl = document.getElementById("testimonies-list");
  const countEl = document.getElementById("testimonies-count");
  const lang = currentLang();

  countEl.textContent = t().testimonyCount(items.length);

  if (items.length === 0) {
    listEl.innerHTML = `<p class="results-empty">${t().testimonyEmpty}</p>`;
    return;
  }

  listEl.innerHTML = items
    .map((item) => {
      const name = escapeHtml(item.name) || t().testimonyAnonymous;
      const message = escapeHtml(item.message);
      const date = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";
      return `
        <article class="card">
          <p style="margin-bottom: var(--space-2);">${message}</p>
          <p class="text-muted" style="margin:0; font-size: var(--font-size-body-s);">
            ${name}${date ? ` &middot; ${escapeHtml(date)}` : ""}
          </p>
        </article>`;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  loadTestimonies();

  const form = document.getElementById("testimony-form");
  const submitBtn = document.getElementById("testimony-submit");
  const statusEl = document.getElementById("testimony-form-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("testimony-name").value;
    const message = document.getElementById("testimony-message").value;

    if (!message.trim()) return;

    submitBtn.disabled = true;
    statusEl.textContent = t().testimonySubmitting;

    try {
      const res = await fetch("/api/testimonies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      if (res.status === 429) {
        statusEl.textContent = t().testimonyRateLimited;
      } else if (res.status === 409) {
        statusEl.textContent = t().testimonyDuplicate;
      } else if (!res.ok) {
        statusEl.textContent = t().testimonyError;
      } else {
        statusEl.textContent = t().testimonySuccess;
        form.reset();
        loadTestimonies();
      }
    } catch (err) {
      statusEl.textContent = t().testimonyError;
    } finally {
      submitBtn.disabled = false;
    }
  });
});

document.addEventListener("langchange", loadTestimonies);
