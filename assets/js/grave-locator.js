/*
  Grave locator.

  Data source: assets/data/graves.csv, a plain, hand-editable spreadsheet,
  no database. Whoever maintains the site can open this file in Excel/Sheets,
  add a row per grave, and re-upload it to the hosting. Columns are documented
  at the top of that file.

  Map: Leaflet + OpenStreetMap tiles, both open source, no API key, no
  vendor account needed. Coordinates come straight from the CSV.
*/

const PAGE_SIZE = 6;
let ALL_GRAVES = [];
let FILTERED = [];
let CURRENT_PAGE = 1;
let MAP, MARKER_LAYER;

function normalize(str) {
  return (str || "").toString().trim().toLowerCase();
}

function loadGraves() {
  const listEl = document.getElementById("results-list");
  listEl.innerHTML = `<p class="results-loading" data-loading-label></p>`;
  document.querySelector("[data-loading-label]").textContent = t().searchLoading;

  Papa.parse("assets/data/graves.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      ALL_GRAVES = results.data.map((row) => ({
        ...row,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
      }));
      FILTERED = ALL_GRAVES.slice();
      initMap();
      renderResults();
    },
    error: () => {
      listEl.innerHTML = `<p class="results-empty">${t().searchError}</p>`;
    },
  });
}

function initMap() {
  if (MAP) return;
  MAP = L.map("map", { scrollWheelZoom: false }).setView([24.7136, 46.6753], 6); // default: Riyadh
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(MAP);
  MARKER_LAYER = L.layerGroup().addTo(MAP);
}

function renderMarkers(records) {
  if (!MARKER_LAYER) return;
  MARKER_LAYER.clearLayers();
  const bounds = [];
  records.forEach((g) => {
    if (Number.isNaN(g.latitude) || Number.isNaN(g.longitude)) return;
    const lang = currentLang();
    const name = lang === "ar" ? g.name_ar : g.name_en;
    const marker = L.marker([g.latitude, g.longitude]).bindPopup(
      `<strong>${escapeHtml(name)}</strong><br>${escapeHtml(t().viewOnMap)}: ${escapeHtml(g.grave_number)}`
    );
    MARKER_LAYER.addLayer(marker);
    bounds.push([g.latitude, g.longitude]);
  });
  if (bounds.length) MAP.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
}

function applyFilters() {
  const nameQuery = normalize(document.getElementById("search-name").value);
  const dateQuery = document.getElementById("search-date").value; // yyyy-mm-dd

  FILTERED = ALL_GRAVES.filter((g) => {
    const nameMatch =
      !nameQuery ||
      normalize(g.name_ar).includes(nameQuery) ||
      normalize(g.name_en).includes(nameQuery);
    const dateMatch =
      !dateQuery || g.death_date === dateQuery || g.birth_date === dateQuery;
    return nameMatch && dateMatch;
  });
  CURRENT_PAGE = 1;
  renderResults();
}

function renderResults() {
  const listEl = document.getElementById("results-list");
  const countEl = document.getElementById("results-count");
  const lang = currentLang();

  countEl.textContent = t().resultsCount(FILTERED.length);

  if (FILTERED.length === 0) {
    listEl.innerHTML = `<p class="results-empty">${t().searchEmpty}</p>`;
    renderMarkers([]);
    renderPagination();
    return;
  }

  const start = (CURRENT_PAGE - 1) * PAGE_SIZE;
  const pageItems = FILTERED.slice(start, start + PAGE_SIZE);

  listEl.innerHTML = pageItems
    .map((g) => {
      const name = escapeHtml(lang === "ar" ? g.name_ar : g.name_en);
      const notes = escapeHtml(lang === "ar" ? g.notes_ar : g.notes_en);
      const address = escapeHtml(lang === "ar" ? g.address_ar : g.address_en);
      const graveId = `grave-${escapeHtml(g.id)}`;
      return `
        <article class="result-card">
          <h3>${name || ""}</h3>
          <div class="result-card__meta">
            <span>${escapeHtml(g.birth_date) || "?"} - ${escapeHtml(g.death_date) || "?"}</span>
            <span>${lang === "ar" ? "رقم القبر" : "Grave no."} ${escapeHtml(g.grave_number) || "?"}</span>
            <span>${escapeHtml(g.section) || ""}</span>
          </div>
          ${address ? `<p class="text-muted">${address}</p>` : ""}
          ${notes ? `<p>${notes}</p>` : ""}
          <div class="result-card__actions">
            <button class="pray-btn" data-pray data-pray-id="${graveId}">
              <span data-pray-label></span>
            </button>
            <div class="share-widget" data-share
                 data-name-ar="${escapeHtml(g.name_ar)}" data-name-en="${escapeHtml(g.name_en)}"
                 data-url="${escapeHtml(window.location.origin + window.location.pathname)}#${graveId}">
              <button class="btn btn--secondary btn--sm" data-share-trigger></button>
              <div class="share-menu" data-share-menu></div>
            </div>
            <button class="btn btn--ghost btn--sm" data-locate="${escapeHtml(g.id)}">${t().viewOnMap}</button>
          </div>
        </article>`;
    })
    .join("");

  renderMarkers(FILTERED);
  renderPagination();
  initShareWidgets();
  initPrayButtons();

  listEl.querySelectorAll("[data-locate]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const record = FILTERED.find((g) => String(g.id) === btn.dataset.locate);
      if (record && !Number.isNaN(record.latitude)) {
        MAP.setView([record.latitude, record.longitude], 16);
      }
    });
  });
}

function renderPagination() {
  const el = document.getElementById("pagination");
  const totalPages = Math.max(1, Math.ceil(FILTERED.length / PAGE_SIZE));
  if (totalPages <= 1) {
    el.innerHTML = "";
    return;
  }
  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button aria-current="${i === CURRENT_PAGE}" data-page="${i}">${i}</button>`;
  }
  el.innerHTML = html;
  el.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      CURRENT_PAGE = parseInt(btn.dataset.page, 10);
      renderResults();
      document.getElementById("results-list").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadGraves();
  document.getElementById("search-name").addEventListener("input", applyFilters);
  document.getElementById("search-date").addEventListener("change", applyFilters);
  document.getElementById("search-form").addEventListener("submit", (e) => e.preventDefault());
});

document.addEventListener("langchange", () => {
  if (ALL_GRAVES.length) renderResults();
});
