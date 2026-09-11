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
    testimonyLoading: "جارٍ تحميل الدعوات...",
    testimonyEmpty: "كن أول من يدعو له.",
    testimonyCount: (n) => `${n} دعوة`,
    directionsFrom: "من أين ستبدأ؟",
    directionsUseLocation: "استخدام موقعي الحالي",
    directionsLocating: "جارٍ تحديد الموقع...",
    directionsLocationError: "تعذّر تحديد الموقع. أدخل نقطة البداية يدويًا.",
    directionsGetGoogle: "المسار عبر خرائط جوجل",
    directionsGetApple: "المسار عبر خرائط آبل",
    directionsTransitNote: "لأوقات المترو والحافلات الدقيقة والحالية، يُنصح أيضًا بمراجعة تطبيق درب الرسمي.",
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
    testimonyLoading: "Loading prayers...",
    testimonyEmpty: "Be the first to pray for him.",
    testimonyCount: (n) => `${n} prayers`,
    directionsFrom: "Where are you starting from?",
    directionsUseLocation: "Use my current location",
    directionsLocating: "Finding your location...",
    directionsLocationError: "Could not find your location. Enter a starting point manually.",
    directionsGetGoogle: "Directions via Google Maps",
    directionsGetApple: "Directions via Apple Maps",
    directionsTransitNote: "For exact, current metro and bus times, it's also worth checking the official Darb app.",
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
