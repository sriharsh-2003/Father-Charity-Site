/*
  Float-up reveal animation. Any element with class="reveal" starts
  invisible/shifted down a touch, then eases into place the first time it
  scrolls into view. Uses IntersectionObserver, which does the "only
  animate once, only when it's actually visible" logic for free.

  Respects reduced motion two ways:
  1. If the browser doesn't support IntersectionObserver, every .reveal
     element is shown immediately (see the "no support" branch below).
  2. main.css already forces near-zero animation/transition duration under
     prefers-reduced-motion, so on those devices this still runs but the
     motion itself is effectively instant.
*/
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));
});

/*
  Dynamically-inserted cards (prayer feed, grave results) render after this
  script's initial pass. Call this from the script that just inserted them
  so those cards get the same float-up treatment instead of appearing
  instantly.
*/
function revealNewElements(container) {
  if (!container) return;
  const items = container.querySelectorAll(".reveal:not(.is-visible)");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => observer.observe(el));
}
