/*
  Grave locator, simplified to a single record.

  This site is dedicated to one person, so there's no search or pagination
  here anymore, just his record, loaded from the first row of
  assets/data/graves.csv. The CSV format is unchanged (still hand-editable,
  still has a grave_number column), this file just no longer searches
  across many rows.

  Map: Leaflet + OpenStreetMap tiles, open source, no API key.

  Directions: builds real Google Maps / Apple Maps deep links using the
  grave's coordinates as the destination and either a typed starting point
  or the visitor's own location (via the browser's geolocation prompt, only
  when they click the button for it, never automatically). This does not
  attempt to reproduce live metro/bus schedules, Google Maps' own transit
  mode is asked to do that work, since it already has real, current transit
  data for supported cities. See README-handoff.md for why.
*/

let GRAVE = null;
let MAP, MARKER;
let USER_COORDS = null; // { lat, lng } if "use my location" succeeded

function loadGrave() {
  const listEl = document.getElementById("results-list");
  listEl.innerHTML = `<p class="results-loading" data-loading-label></p>`;
  document.querySelector("[data-loading-label]").textContent = t().searchLoading;

  Papa.parse("assets/data/graves.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rows = results.data.map((row) => ({
        ...row,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
      }));
      GRAVE = rows[0] || null;
      initMap();
      renderGrave();
    },
    error: () => {
      listEl.innerHTML = `<p class="results-empty">${t().searchError}</p>`;
    },
  });
}

function initMap() {
  if (MAP || !GRAVE) return;
  const lat = Number.isNaN(GRAVE.latitude) ? 24.7136 : GRAVE.latitude;
  const lng = Number.isNaN(GRAVE.longitude) ? 46.6753 : GRAVE.longitude;
  MAP = L.map("map", { scrollWheelZoom: false }).setView([lat, lng], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(MAP);

  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    const lang = currentLang();
    const name = lang === "ar" ? GRAVE.name_ar : GRAVE.name_en;
    MARKER = L.marker([lat, lng])
      .addTo(MAP)
      .bindPopup(`<strong>${escapeHtml(name)}</strong>`)
      .openPopup();
  }
}

function renderGrave() {
  const listEl = document.getElementById("results-list");
  const lang = currentLang();

  if (!GRAVE) {
    listEl.innerHTML = `<p class="results-empty">${t().searchEmpty}</p>`;
    return;
  }

  const name = escapeHtml(lang === "ar" ? GRAVE.name_ar : GRAVE.name_en);
  const notes = escapeHtml(lang === "ar" ? GRAVE.notes_ar : GRAVE.notes_en);
  const address = escapeHtml(lang === "ar" ? GRAVE.address_ar : GRAVE.address_en);

  listEl.innerHTML = `
    <article class="result-card">
      <h3>${name || ""}</h3>
      <div class="result-card__meta">
        <span>${escapeHtml(GRAVE.birth_date) || "?"} - ${escapeHtml(GRAVE.death_date) || "?"}</span>
        <span>${lang === "ar" ? "رقم القبر" : "Grave no."} ${escapeHtml(GRAVE.grave_number) || "?"}</span>
        <span>${escapeHtml(GRAVE.section) || ""}</span>
      </div>
      ${address ? `<p class="text-muted">${address}</p>` : ""}
      ${notes ? `<p>${notes}</p>` : ""}
      <div class="result-card__actions">
        <div class="share-widget" data-share
             data-name-ar="${escapeHtml(GRAVE.name_ar)}" data-name-en="${escapeHtml(GRAVE.name_en)}"
             data-url="${escapeHtml(window.location.origin + window.location.pathname)}">
          <button class="btn btn--secondary btn--sm" data-share-trigger></button>
          <div class="share-menu" data-share-menu></div>
        </div>
      </div>
    </article>`;

  initShareWidgets();
  initDirectionsBox();
}

/* ---------------------------------------------------------------------- */
/* Directions box                                                          */
/* ---------------------------------------------------------------------- */

function buildMapsLinks() {
  if (!GRAVE || Number.isNaN(GRAVE.latitude) || Number.isNaN(GRAVE.longitude)) return;

  const dest = `${GRAVE.latitude},${GRAVE.longitude}`;
  const originText = document.getElementById("directions-from").value.trim();
  const origin = USER_COORDS ? `${USER_COORDS.lat},${USER_COORDS.lng}` : originText;

  const googleLink = document.getElementById("directions-google");
  const appleLink = document.getElementById("directions-apple");

  const googleParams = new URLSearchParams({
    api: "1",
    destination: dest,
    travelmode: "transit",
  });
  if (origin) googleParams.set("origin", origin);
  googleLink.href = `https://www.google.com/maps/dir/?${googleParams.toString()}`;

  const appleParams = new URLSearchParams({ daddr: dest });
  if (origin) appleParams.set("saddr", origin);
  appleLink.href = `https://maps.apple.com/?${appleParams.toString()}`;

  // Basic device hint only, both links always stay available since sniffing
  // is never fully reliable.
  const isIOS = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
  googleLink.classList.toggle("btn--primary", !isIOS);
  googleLink.classList.toggle("btn--secondary", isIOS);
  appleLink.classList.toggle("btn--primary", isIOS);
  appleLink.classList.toggle("btn--secondary", !isIOS);
}

function initDirectionsBox() {
  const box = document.getElementById("directions-box");
  if (!box || !GRAVE || Number.isNaN(GRAVE.latitude)) return;
  box.hidden = false;

  document.querySelector("[data-i18n-directions-from]").textContent = t().directionsFrom;
  document.getElementById("directions-google").textContent = t().directionsGetGoogle;
  document.getElementById("directions-apple").textContent = t().directionsGetApple;
  document.getElementById("directions-transit-note").textContent = t().directionsTransitNote;

  const useLocationBtn = document.getElementById("directions-use-location");
  useLocationBtn.textContent = t().directionsUseLocation;

  const fromInput = document.getElementById("directions-from");
  const statusEl = document.getElementById("directions-status");

  fromInput.addEventListener("input", () => {
    USER_COORDS = null;
    buildMapsLinks();
  });

  useLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      statusEl.textContent = t().directionsLocationError;
      return;
    }
    statusEl.textContent = t().directionsLocating;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        USER_COORDS = { lat: position.coords.latitude, lng: position.coords.longitude };
        fromInput.value = "";
        statusEl.textContent = "";
        buildMapsLinks();
      },
      () => {
        statusEl.textContent = t().directionsLocationError;
      },
      { timeout: 10000 }
    );
  });

  buildMapsLinks();
}

document.addEventListener("DOMContentLoaded", loadGrave);

document.addEventListener("langchange", () => {
  if (GRAVE) {
    renderGrave();
  }
});
