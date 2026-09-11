let ADMIN_TOKEN = "";

async function loadAdminList() {
  const status = document.getElementById("admin-status");
  const list = document.getElementById("admin-list");
  status.textContent = "Loading...";
  try {
    const res = await fetch("/api/prayers");
    const data = await res.json();
    const items = data.prayers || [];
    status.textContent = `${items.length} prayers`;
    list.innerHTML = items
      .map(
        (item) => `
        <article class="card">
          ${item.verse ? `<p class="text-muted" style="font-size: var(--font-size-body-s); margin:0 0 4px;">Verse: ${escapeHtml(item.verse)}</p>` : ""}
          <p>${item.message ? escapeHtml(item.message) : "<em>(no message, prayer only)</em>"}</p>
          <p class="text-muted" style="font-size: var(--font-size-body-s);">
            ${escapeHtml(item.name) || "Anonymous"} &middot; ${escapeHtml(item.createdAt)}
          </p>
          <button class="btn btn--secondary btn--sm" data-delete-id="${escapeHtml(item.id)}">Delete</button>
        </article>
      `
      )
      .join("");

    list.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this prayer entry? This cannot be undone.")) return;
        btn.disabled = true;
        const res = await fetch(`/api/prayers?id=${encodeURIComponent(btn.dataset.deleteId)}`, {
          method: "DELETE",
          headers: { "x-admin-token": ADMIN_TOKEN },
        });
        if (res.ok) {
          loadAdminList();
        } else {
          alert("Delete failed (check the admin token).");
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    status.textContent = "Could not load prayers.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("admin-load").addEventListener("click", () => {
    ADMIN_TOKEN = document.getElementById("admin-token").value.trim();
    loadAdminList();
  });
});
