/*
  Pray button.

  IMPORTANT LIMITATION (flagged here on purpose, and in the handoff notes):
  This is per-device only, stored in localStorage. It is NOT a real IP-based
  or account-based tracker, and it cannot show a shared "1,204 people have
  prayed for him" count across all visitors. That would need a server and a
  database, which the brief explicitly ruled out for the MVP. What it CAN do,
  with zero data collection: remember on this browser/device whether this
  person prayed for a given grave, so the button does not reset every visit.

  Markup contract:
  <button class="pray-btn" data-pray data-pray-id="grave-0007">
    <span data-pray-label></span>
  </button>
  <span class="text-muted" data-pray-count-label></span>  (optional, sitewide total)
*/

function prayedIds() {
  try {
    return JSON.parse(localStorage.getItem("prayed_ids") || "[]");
  } catch (e) {
    return [];
  }
}

function markPrayed(id) {
  const ids = prayedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem("prayed_ids", JSON.stringify(ids));
  }
  return ids.length;
}

function renderPrayButton(btn) {
  const id = btn.dataset.prayId;
  const label = btn.querySelector("[data-pray-label]") || btn;
  const already = prayedIds().includes(id);
  btn.setAttribute("aria-pressed", String(already));
  btn.disabled = already;
  label.textContent = already ? t().prayDone : t().prayDefault;
}

function renderPrayCounters() {
  const total = prayedIds().length;
  document.querySelectorAll("[data-pray-count-label]").forEach((el) => {
    el.textContent = t().prayCount(total);
  });
}

function initPrayButtons() {
  document.querySelectorAll("[data-pray]").forEach((btn) => {
    renderPrayButton(btn);
    if (btn.dataset.prayBound) return;
    btn.dataset.prayBound = "1";
    btn.addEventListener("click", () => {
      const id = btn.dataset.prayId;
      if (!id) return;
      markPrayed(id);
      renderPrayButton(btn);
      renderPrayCounters();
      showToast(t().prayDone, "success");
    });
  });
  renderPrayCounters();
}

document.addEventListener("DOMContentLoaded", initPrayButtons);
document.addEventListener("langchange", initPrayButtons);
