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
    directionsSearch: "بحث",
    directionsUseLocation: "استخدام موقعي الحالي",
    directionsLocating: "جارٍ تحديد الموقع...",
    directionsLocationError: "تعذّر تحديد الموقع. أدخل نقطة البداية يدويًا.",
    directionsMissingOrigin: "الرجاء كتابة نقطة البداية، أو استخدام موقعك الحالي.",
    directionsGetGoogle: "المسار عبر خرائط جوجل",
    directionsGetApple: "المسار عبر خرائط آبل",
    directionsTransitNote: "لأوقات المترو والحافلات الدقيقة والحالية، يُنصح أيضًا بمراجعة تطبيق درب الرسمي.",
    donationInvalidAmount: "الرجاء اختيار مبلغ أو إدخال مبلغ صحيح.",
    donationSubmitting: "جارٍ التحضير للدفع...",
    donationPendingGateway: "بوابة الدفع الإلكتروني لم تُفعَّل بعد من قِبل الجهة المعنية. بياناتك أدناه جاهزة، وسنُتابع معك بمجرد تفعيلها، أو يمكنك التبرع الآن عبر التحويل البنكي بالأسفل.",
    donationGatewayError: "تعذّر الاتصال ببوابة الدفع. حاول مرة أخرى، أو تبرع عبر التحويل البنكي بالأسفل.",
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
    directionsSearch: "Search",
    directionsUseLocation: "Use my current location",
    directionsLocating: "Finding your location...",
    directionsLocationError: "Could not find your location. Enter a starting point manually.",
    directionsMissingOrigin: "Please type a starting point, or use your current location.",
    directionsGetGoogle: "Directions via Google Maps",
    directionsGetApple: "Directions via Apple Maps",
    directionsTransitNote: "For exact, current metro and bus times, it's also worth checking the official Darb app.",
    donationInvalidAmount: "Please choose an amount or enter a valid one.",
    donationSubmitting: "Preparing payment...",
    donationPendingGateway: "Online payment hasn't been switched on yet. Your details below are ready to go, we'll follow up as soon as it is, or you can give now by bank transfer below.",
    donationGatewayError: "Could not reach the payment gateway. Please try again, or give by bank transfer below.",
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
  // The browser tab title can't contain markup (a <title> only ever shows
  // as plain text, so the old <span class="i18n-ar">...</span> markup used
  // everywhere else in the page was showing up literally in the tab). Each
  // page instead sets data-title-ar / data-title-en on <html>, and this is
  // the one place that turns that into the real document.title.
  const titleAr = document.documentElement.getAttribute("data-title-ar");
  const titleEn = document.documentElement.getAttribute("data-title-en");
  if (titleAr && titleEn) {
    document.title = lang === "ar" ? titleAr : titleEn;
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
