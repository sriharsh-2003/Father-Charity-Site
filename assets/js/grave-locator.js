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
    MARKER = L.marker([lat, lng]).addTo(MAP);
    updateMarkerPopup();
    MARKER.openPopup();
  }
}

// Keeps the map pin's popup name in the visitor's current language. Split
// out from initMap() (which only ever runs once) so switching languages
// after the map has already loaded still shows the right name, instead of
// leaving whatever language was active on first load.
function updateMarkerPopup() {
  if (!MARKER || !GRAVE) return;
  const lang = currentLang();
  const name = lang === "ar" ? GRAVE.name_ar : GRAVE.name_en;
  const wasOpen = MARKER.isPopupOpen();
  MARKER.bindPopup(`<strong>${escapeHtml(name)}</strong>`);
  if (wasOpen) MARKER.openPopup();
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

let DIRECTIONS_LISTENERS_BOUND = false;

// The directions box is static markup on the page (only #results-list gets
// re-rendered on language change), so its event listeners only ever need
// binding once. Re-running renderGrave() on every langchange used to call
// this whole function again, which kept re-adding listeners to the same
// buttons/input -- clicking "use my location" after a language switch or
// two would fire the geolocation prompt multiple times over. Text labels
// still need refreshing on every call (that part IS language-dependent),
// so the two are split below.
function initDirectionsBox() {
  const box = document.getElementById("directions-box");
  if (!box || !GRAVE || Number.isNaN(GRAVE.latitude)) return;
  box.hidden = false;

  document.querySelector("[data-i18n-directions-from]").textContent = t().directionsFrom;
  document.getElementById("directions-google").textContent = t().directionsGetGoogle;
  document.getElementById("directions-apple").textContent = t().directionsGetApple;
  document.getElementById("directions-transit-note").textContent = t().directionsTransitNote;
  document.getElementById("directions-use-location").textContent = t().directionsUseLocation;

  const searchBtn = document.getElementById("directions-search");
  if (searchBtn) {
    searchBtn.textContent = t().directionsSearch;
    searchBtn.setAttribute("aria-label", t().directionsSearch);
  }

  if (!DIRECTIONS_LISTENERS_BOUND) {
    bindDirectionsListeners();
    DIRECTIONS_LISTENERS_BOUND = true;
  }

  buildMapsLinks();
}

function bindDirectionsListeners() {
  const fromInput = document.getElementById("directions-from");
  const statusEl = document.getElementById("directions-status");
  const searchBtn = document.getElementById("directions-search");
  const useLocationBtn = document.getElementById("directions-use-location");
  const box = document.getElementById("directions-box");

  // The links below already update live as you type (kept, it's harmless).
  // Pressing Search (or Enter) used to just quietly update the href on the
  // two "Directions via..." buttons below, with no other feedback, which
  // read as the button doing nothing. It now actually opens directions in
  // a new tab right away, same destination link those buttons use, so
  // there's an immediate, visible result. Requires a starting point (typed
  // or "use my location") since directions need one; without it, this
  // just tells the visitor what's missing instead of silently failing.
  function confirmTypedOrigin() {
    const typed = fromInput.value.trim();
    if (!typed && !USER_COORDS) {
      statusEl.textContent = t().directionsMissingOrigin;
      fromInput.focus();
      return;
    }
    if (typed) USER_COORDS = null;
    buildMapsLinks();
    statusEl.textContent = "";
    if (box) {
      box.classList.remove("directions-box--confirmed");
      // Force reflow so the class can be re-added to restart the animation
      // if the visitor clicks search more than once in a row.
      void box.offsetWidth;
      box.classList.add("directions-box--confirmed");
    }
    const isIOS = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
    const link = isIOS ? document.getElementById("directions-apple") : document.getElementById("directions-google");
    window.open(link.href, "_blank", "noopener");
  }

  fromInput.addEventListener("input", () => {
    USER_COORDS = null;
    buildMapsLinks();
  });

  fromInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmTypedOrigin();
    }
  });

  if (searchBtn) {
    searchBtn.addEventListener("click", confirmTypedOrigin);
  }

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
}

document.addEventListener("DOMContentLoaded", loadGrave);

document.addEventListener("langchange", () => {
  if (GRAVE) {
    renderGrave();
    updateMarkerPopup();
  }
});
