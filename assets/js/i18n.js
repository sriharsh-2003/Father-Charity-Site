/*
  Language switching.
  Static page content is written twice in the HTML (.i18n-ar / .i18n-en),
  toggled purely by CSS based on <html lang="...">. This script only:
  1. restores the saved language on load,
  2. flips <html lang> + wires the toggle button,
  3. exposes UI_STRINGS so other scripts (share.js, pray.js, grave-locator.js)
     can label things that are generated in JS, not written in the HTML.
*/

const UI_STRINGS = {
  ar: {
    shareTitle: "مشاركة",
    shareWhatsapp: "واتساب",
    shareX: "X",
    shareTelegram: "تيليجرام",
    shareCopy: "نسخ الرابط",
    shareCopied: "تم نسخ الرابط",
    shareNative: "مشاركة عبر التطبيقات",
    shareMessage: (name) => `ادعوا لـ ${name} بالرحمة والمغفرة`,
    prayDefault: "ادعُ له",
    prayDone: "دعوت له",
    prayCount: (n) => `${n} دعوة من جهازك`,
    searchLoading: "جارٍ تحميل السجلات...",
    searchEmpty: "لا توجد نتائج مطابقة. جرّب اسمًا أو تاريخًا مختلفًا.",
    searchError: "تعذّر تحميل بيانات المقابر. حاول تحديث الصفحة.",
    resultsCount: (n) => `${n} نتيجة`,
    viewOnMap: "عرض على الخريطة",
    testimonyAnonymous: "زائر",
    testimonySubmitting: "جارٍ الإرسال...",
    testimonySuccess: "تم إرسال رسالتك، جزاك الله خيرًا",
    testimonyError: "تعذّر إرسال الرسالة. حاول مرة أخرى.",
    testimonyDuplicate: "يبدو أن هذه الرسالة أُرسلت للتو.",
    testimonyRateLimited: "الرجاء الانتظار قليلاً قبل الإرسال مرة أخرى.",
    testimonyLoading: "جارٍ تحميل الرسائل...",
    testimonyEmpty: "كن أول من يترك كلمة.",
    testimonyCount: (n) => `${n} رسالة`,
  },
  en: {
    shareTitle: "Share",
    shareWhatsapp: "WhatsApp",
    shareX: "X",
    shareTelegram: "Telegram",
    shareCopy: "Copy link",
    shareCopied: "Link copied",
    shareNative: "Share",
    shareMessage: (name) => `Please pray for ${name}, mercy and forgiveness`,
    prayDefault: "Pray for them",
    prayDone: "You prayed",
    prayCount: (n) => `${n} prayers from your device`,
    searchLoading: "Loading records...",
    searchEmpty: "No matching results. Try a different name or date.",
    searchError: "Could not load grave records. Try refreshing the page.",
    resultsCount: (n) => `${n} results`,
    viewOnMap: "View on map",
    testimonyAnonymous: "A visitor",
    testimonySubmitting: "Submitting...",
    testimonySuccess: "Your message was sent, thank you",
    testimonyError: "Could not send your message. Please try again.",
    testimonyDuplicate: "It looks like this message was just sent.",
    testimonyRateLimited: "Please wait a moment before submitting again.",
    testimonyLoading: "Loading messages...",
    testimonyEmpty: "Be the first to leave a word.",
    testimonyCount: (n) => `${n} messages`,
  },
};

function currentLang() {
  return document.documentElement.getAttribute("lang") || "ar";
}

function t() {
  return UI_STRINGS[currentLang()];
}

function applyLang(lang) {
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  localStorage.setItem("site_lang", lang);
  const toggle = document.querySelector("[data-lang-toggle]");
  if (toggle) {
    toggle.textContent = lang === "ar" ? "English" : "العربية";
  }
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("site_lang") || document.documentElement.getAttribute("lang") || "ar";
  applyLang(saved);

  const toggle = document.querySelector("[data-lang-toggle]");
  if (toggle) {
    toggle.addEventListener("click", () => {
      applyLang(currentLang() === "ar" ? "en" : "ar");
    });
  }
});
