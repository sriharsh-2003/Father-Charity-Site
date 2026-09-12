/*
  Donation campaign numbers. Same hand-editable pattern as graves.csv and
  verses.js: no build step, edit the numbers below and refresh.

  This does NOT process payments -- there is still no licensed payment
  gateway wired up (see README-handoff.md, "Donation name collection").
  It only renders a progress counter against a target, updated by hand
  whenever new contributions come in (e.g. bank transfers). Once a gateway
  is connected, "raised" can be driven from its API instead of hand-edited.
*/

const DONATION_CAMPAIGN = {
  // Change this any time the goal changes. The progress bar and percentage
  // recalculate automatically, nothing else needs to be touched.
  targetAmount: 200000,

  // Update by hand as contributions come in (e.g. after reconciling bank
  // transfers). Whole numbers only, no currency symbol.
  raisedAmount: 42500,

  currency: "SAR",
  currencySymbolAr: "ر.س",
  currencySymbolEn: "SAR",
};
