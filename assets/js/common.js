/* Mobile nav toggle */

// Shared HTML-escaping helper. Anything that comes from a CSV file or a
// user submission is untrusted content and must go through this before it
// touches innerHTML or an HTML attribute. Used by grave-locator.js,
// visitation-dates.js, and the testimonies page.
function escapeHtml(value) {
  return (value ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {  const navBtn = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-main-nav]");
  if (navBtn && nav) {
    navBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navBtn.setAttribute("aria-expanded", String(open));
    });
  }

  // Privacy / cookie-style notice banner. Checklist item 41: must be visible
  // and easy to find, not buried. Shown once, dismissal remembered locally.
  const banner = document.querySelector("[data-privacy-banner]");
  if (banner) {
    if (localStorage.getItem("privacy_notice_dismissed") === "1") {
      banner.hidden = true;
    }
    const dismiss = banner.querySelector("[data-privacy-dismiss]");
    if (dismiss) {
      dismiss.addEventListener("click", () => {
        banner.hidden = true;
        localStorage.setItem("privacy_notice_dismissed", "1");
      });
    }
  }
});

/* Simple toast/notification helper, used across pages */
function showToast(message, variant) {
  let region = document.querySelector(".toast-region");
  if (!region) {
    region = document.createElement("div");
    region.className = "toast-region";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }
  const toast = document.createElement("div");
  toast.className = "toast" + (variant ? ` toast--${variant}` : "");
  toast.textContent = message;
  region.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}
