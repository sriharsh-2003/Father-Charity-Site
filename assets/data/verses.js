/*
  Curated verses for the "pray for him" flow.

  These are a STARTING list, not a final religious decision on my part.
  Sourced from commonly cited verses/duas for the deceased (Quran.com's own
  "Duas for the Dead" collection at quran.com/duas/deceased, plus Surah
  Yaseen and Surah Al-Ikhlas, both widely cited in fiqh discussions on
  graveside recitation). Please have someone with religious authority review
  this list before it goes live, practice varies by school of thought (for
  example, some scholars discourage collective Al-Fatiha recitation for the
  deceased specifically, while treating it as fine individually), and that
  is not a judgment call for a website builder to make alone.

  "url" opens the exact verse or surah on quran.com in a new tab, where it
  can be read and played with quran.com's own player. See README-handoff.md
  for why this links out rather than embedding audio directly.
*/

const CURATED_VERSES = [
  { id: "1", key: "1", label_ar: "سورة الفاتحة", label_en: "Surah Al-Fatiha", url: "https://quran.com/1" },
  { id: "2", key: "2:255", label_ar: "آية الكرسي", label_en: "Ayat al-Kursi (2:255)", url: "https://quran.com/2/255" },
  { id: "3", key: "36", label_ar: "سورة يس", label_en: "Surah Yaseen", url: "https://quran.com/36" },
  { id: "4", key: "112", label_ar: "سورة الإخلاص", label_en: "Surah Al-Ikhlas", url: "https://quran.com/112" },
  { id: "5", key: "2:286", label_ar: "خاتمة سورة البقرة", label_en: "Closing verse of Al-Baqarah (2:286)", url: "https://quran.com/2/286" },
  { id: "6", key: "23:40-41", label_ar: "دعاء للوالدين (المؤمنون ٤٠-٤١)", label_en: "Dua for parents (Al-Mu'minun 40-41)", url: "https://quran.com/23/40-41" },
];
