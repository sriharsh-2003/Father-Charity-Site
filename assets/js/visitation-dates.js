/*
  Upcoming visitation dates.
  Same pattern as the grave data: a plain CSV anyone can hand-edit, no
  database. Only shows dates that are today or in the future; past dates
  drop off automatically without anyone needing to delete rows.

  Markup contract: an element with id="visitation-dates" somewhere on the
  page. If it's not on the page, this script just does nothing.
*/

function initVisitationDates() {
  const container = document.getElementById("visitation-dates");
  const wrap = document.getElementById("visitation-dates-wrap");
  if (!container) return;

  Papa.parse("assets/data/visitation-dates.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const today = new Date().toISOString().slice(0, 10);
      const upcoming = results.data
        .filter((row) => row.date && row.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (upcoming.length === 0) {
        if (wrap) wrap.hidden = true;
        return;
      }

      const lang = currentLang();
      if (wrap) wrap.hidden = false;
      container.innerHTML = upcoming
        .map((row) => {
          const title = escapeHtml(lang === "ar" ? row.title_ar : row.title_en);
          const notes = escapeHtml(lang === "ar" ? row.notes_ar : row.notes_en);
          return `
            <div class="visitation-item">
              <span class="visitation-item__date">${escapeHtml(row.date)}</span>
              <span class="visitation-item__title">${title || ""}</span>
              ${notes ? `<span class="visitation-item__notes">${notes}</span>` : ""}
            </div>`;
        })
        .join("");
    },
    error: () => {
      if (wrap) wrap.hidden = true;
    },
  });
}

document.addEventListener("DOMContentLoaded", initVisitationDates);
document.addEventListener("langchange", initVisitationDates);
