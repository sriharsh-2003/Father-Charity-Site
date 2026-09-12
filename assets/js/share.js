/*
  Share widget.
  Markup contract (see components in any .html file for a live example):

  <div class="share-widget" data-share
       data-name-ar="اسم المتوفى" data-name-en="Deceased name"
       data-url="https://example.sa/grave/123">
    <button class="btn btn--secondary btn--sm" data-share-trigger>...</button>
    <div class="share-menu" data-share-menu></div>
  </div>

  The message text is picked from UI_STRINGS.shareMessage() based on the
  CURRENT site language at the moment the person clicks share, so an Arabic
  visitor shares an Arabic sentence, an English visitor shares an English one.
*/

// Fire-and-forget: tells /api/shares a share happened, for the homepage
// stats section. Never blocks or shows an error to the visitor if this
// fails (a metrics ping failing shouldn't get in the way of the actual
// share they're trying to do), and never awaited by callers.
function recordShare() {
  fetch("/api/shares", { method: "POST" }).catch(() => {});
}

function buildShareMenu(widget) {
  const menu = widget.querySelector("[data-share-menu]");
  const url = widget.dataset.url || window.location.href;
  const lang = currentLang();
  const name = lang === "ar" ? widget.dataset.nameAr : widget.dataset.nameEn;
  const message = t().shareMessage(name || "");
  const fullText = `${message}\n${url}`;

  menu.innerHTML = "";

  const links = [
    {
      label: t().shareWhatsapp,
      href: `https://wa.me/?text=${encodeURIComponent(fullText)}`,
    },
    {
      label: t().shareX,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: t().shareTelegram,
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`,
    },
  ];

  links.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.label;
    a.addEventListener("click", recordShare);
    menu.appendChild(a);
  });

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.textContent = t().shareCopy;
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      showToast(t().shareCopied, "success");
      recordShare();
    } catch (e) {
      showToast(fullText);
    }
    menu.classList.remove("is-open");
  });
  menu.appendChild(copyBtn);
}

function initShareWidgets() {
  document.querySelectorAll("[data-share]").forEach((widget) => {
    const trigger = widget.querySelector("[data-share-trigger]");
    const menu = widget.querySelector("[data-share-menu]");
    if (!trigger || !menu) return;

    trigger.textContent = t().shareTitle;

    trigger.addEventListener("click", async () => {
      const url = widget.dataset.url || window.location.href;
      const lang = currentLang();
      const name = lang === "ar" ? widget.dataset.nameAr : widget.dataset.nameEn;
      const message = t().shareMessage(name || "");

      // Prefer the native OS share sheet (Apple / Android) when available:
      // this is what lets the person share straight into any app they have.
      if (navigator.share) {
        try {
          await navigator.share({ title: message, text: message, url });
          recordShare();
          return;
        } catch (e) {
          /* person cancelled the native sheet, fall through to the menu */
        }
      }
      buildShareMenu(widget);
      menu.classList.toggle("is-open");
    });

    document.addEventListener("click", (e) => {
      if (!widget.contains(e.target)) menu.classList.remove("is-open");
    });
  });
}

document.addEventListener("DOMContentLoaded", initShareWidgets);
document.addEventListener("langchange", initShareWidgets);
