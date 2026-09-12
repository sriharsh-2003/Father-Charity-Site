# Handoff notes: v0.1 (MVP scaffold)

This is a working first pass, built as plain HTML/CSS/JS so it drops onto a
government static-hosting environment with no build step: copy the folder,
done. Everything below is either a decision you should sanity-check, or a
placeholder waiting on real content/assets.

## What's real vs. placeholder

**Real and working:**
- Bilingual AR/EN toggle, RTL/LTR switching, saved per device
- Grave locator: single grave record (this is a one-person site, see Round 3
  below for why search/pagination were removed), Leaflet + OpenStreetMap map
  with a marker, plus a directions module (typed starting point or "use my
  location", Google/Apple Maps deep links) -- all driven by
  `assets/data/graves.csv`
- "Pray for him": full page with a curated verse picker, optional name/word,
  submits to a real shared count across all visitors (Round 3, backed by
  Redis, see below) -- the localStorage-only limitation flagged further
  down in this doc no longer applies, that was true of the original v0.1
  pray *button* which pray.html replaced
- Share: native OS share sheet (Apple/Android) where supported, with a
  WhatsApp / X / Telegram / copy-link fallback menu; the shared message text
  matches whichever language the visitor currently has selected
- Privacy notice banner + a full privacy/security page (DGA checklist item 41)
  -- **now out of date, see the flag in Round 5 below**, it still says the
  site collects no personal data, which stopped being true once prayers and
  the donation form started asking for a name/message/email
- Responsive layout, keyboard focus states, reduced-motion respected
- Browser tab titles and a real favicon on every page (Round 5)
- Donation form: amount presets, custom amount, name, email, all validated
  client-side and ready to submit the moment a payment gateway exists
  (Round 5), though there is nothing to submit *to* yet
- Knowledge hub articles have real content now, not placeholder text
  (Round 5) -- still needs a read-through by someone with religious
  authority before treating the wording as final, see that section

**Placeholder, needs your input before this is presentable:**
- All bracketed text like `[اسم الوالد]` / `[Father's Name]`, the bio section
  on the home page, footer address, the bank-transfer account details on
  the donate page, the "editable email" contact address on `privacy.html`
- Logo mark is a text placeholder (`brand__mark` in the header). Swap for
  the real logo file
- `assets/data/graves.csv` grave record still has bracketed placeholders
  for birth date, address, and cemetery name (name, death date, grave
  number, and coordinates are real, see Round 4/5 below)
- Donation progress numbers (`assets/data/donation.js`) are placeholders,
  currently `0` raised / `200,000` SAR target, waiting on the real figures
- No payment gateway yet; the donation form is fully built and validated
  client-side (Round 5) but has nothing to submit to until the client
  provides one (see `apiEndpoint` in `assets/data/donation.js`)

## New in this round: visitation dates, testimonies backend, Vercel

**Upcoming visitation dates.** `assets/data/visitation-dates.csv`, same
hand-editable pattern as the grave data. Only shows dates that are today or
later; past dates just stop appearing, nobody has to clean up old rows. It's
surfaced on the home page, right under the hero, since that's the most
visible real estate on the site.

**Testimonies (`testimonies.html` + `/api/testimonies`).** This is the
site's first and only write-capable feature, everything else stays static.
Any visitor can leave a short message; anyone with the admin token can
remove one. How it works:

- **Storage: Upstash Redis via Vercel Marketplace.** Vercel's own KV product
  was retired in December 2024 and folded into the Marketplace, so this is
  the direct, current path, not a workaround. In the Vercel dashboard:
  Storage tab, Marketplace, install the Upstash Redis integration, connect
  it to this project. Vercel injects `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` automatically.
- **Set one more environment variable by hand: `ADMIN_TOKEN`.** Make it long
  and random (a password generator, 32+ characters). This is the only thing
  standing between the public and the delete button, so treat it like a real
  secret, not something to paste into a group chat.
- **Moderation flow:** open `admin.html` (it's not linked anywhere in the
  site's navigation), paste the admin token, and delete whatever needs
  removing. The token is kept only in that browser tab's memory, never
  saved, so it's re-entered each visit. That's a deliberate trade-off for a
  one- or two-person moderation workflow, not something to scale past that
  without adding real accounts.
- **Abuse protection already built in:** rate limiting (3 submissions per
  IP per minute), a duplicate guard (same IP resubmitting the same text
  within an hour gets rejected, this is the "no duplicates" you asked for at
  the submission level), a 500-character cap per message, and every field
  is HTML-escaped before rendering, since this is the one place on the site
  where the content genuinely comes from strangers, not from staff editing
  a CSV.
- **This introduces a real data-collection question you should be aware
  of.** Submitted names and messages are now stored on a server, which is a
  different privacy posture than everything else on the site. `privacy.html`
  will need a real update once this goes live (who can see submissions, how
  long they're kept, how to request removal), this isn't done yet, flagging
  it rather than quietly leaving it stale.

**Security headers, now that hosting is confirmed as Vercel.**
`vercel.json` sets a Content-Security-Policy restricting scripts to the
site's own origin (no CDN, matches the vendoring work from last round),
plus `X-Frame-Options`, `X-Content-Type-Options`, and a `Referrer-Policy`.
This closes the "headers need to be set at the web server level" gap noted
in the previous security review, Vercel makes that configurable from inside
the repo. One honest caveat: the CSS still uses some inline `style=""`
attributes here and there, which needed `'unsafe-inline'` allowed for
`style-src` specifically (not for scripts, those stay locked to `'self'`
with zero exceptions). A future pass could move those into classes for a
fully strict policy, flagging it rather than pretending it's not there.

**`package.json`** was added, just enough for Vercel to recognize
`/api/testimonies.js` as an ES module. It adds no dependencies and changes
nothing about how the static site itself runs.

## Getting a live preview

`preview-home.html` in this folder is a self-contained version of just the
home page (CSS and JS inlined) so it can be opened directly, useful for a
quick look without deploying anything. It won't show the visitation-dates
CSV data (that needs a real server to fetch the file) or any other page,
it's a visual preview only.

For the real thing: push this folder to GitHub (see the steps from last
round), then in Vercel choose **Add New → Project**, import that repository,
and deploy. No build settings to configure, it's already a static site plus
one `/api` function. Add the `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, and `ADMIN_TOKEN` environment variables in the
Vercel project settings before the testimonies page will work, everything
else works immediately on deploy.

One note if you open the unzipped folder locally by double-clicking
`index.html`: most pages will work, but `grave-locator.html` (and now the
home page's visitation dates) load their CSV over `fetch()`, which most
browsers block under the `file://` protocol for security reasons. Run
`python3 -m http.server` from inside the folder (or `npx serve`) and open
`http://localhost:8000` instead if you want to test those locally before
deploying.

## Still open, discussed but not built this round

- **Nearest metro/bus/route for the graveyard-visiting enhancement.** See
  the discussion in chat: recommend linking to official journey planners
  rather than building custom routing, pending a decision.
- **Quran verse audio for Blessing Sharing.** Technically feasible via
  public Quran audio APIs, pending your confirmation of which verses/reciter
  to feature (a decision for you, not something to pick unilaterally on a
  memorial site).
- **Donation name collection.** Accepted as necessary. **Partially addressed
  in Round 5**: the donation form now collects name/email client-side, but
  the full data-handling pass this bullet asks for (dedup strategy, actual
  storage, privacy policy update) still hasn't happened, it can't until a
  real payment gateway exists to submit to. See "Still open, updated" at
  the end of this document for the current state.

## Colors, type, spacing: read this before judging how it looks

Every color, font size, and spacing value lives in **`assets/css/tokens.css`**
as CSS variables. None of it is the actual DGA Platforms Code token set,
that lives behind their Figma library, which we don't have access to. What's
here is a placeholder palette (deep green, warm parchment background, muted
gold accent) chosen to feel dignified and government-adjacent while we wait
for the real tokens.

**When you send screenshots of the real DGA site or get Figma access**, the
fix is almost entirely confined to this one file (hex values, font sizes,
spacing scale), not a rebuild. Typography is already set to IBM Plex Sans
Arabic (loaded from Google Fonts), since that part of the checklist is
explicit and unambiguous.

Page structure follows the DGA template names from the checklist as closely
as the text descriptions allow: home page (hero → intro → sections), search
page (search bar → results list + map → pagination). Components (buttons,
search fields, notifications, pagination) are built with the interactive
states the checklist calls for (default/hover/focus/disabled), but their
exact shape, radius, and spacing are our placeholder guesses, not DGA's.

## Two things flagged for you specifically (v0.1 -- see note on #1)

1. ~~**Pray button ≠ real analytics.**~~ **Superseded in Round 3.** This
   applied to the original v0.1 pray button (localStorage only, no server).
   `pray.html` replaced it with a real, shared, server-backed count. Left
   here for the record rather than deleted, since it explains *why* Round 3
   made the change it made.
2. **CSV, not a database, as requested.** A CSV that "can expand to
   large sizes" has a ceiling. A few hundred rows load fine in the browser.
   Several thousand+ rows with photos/notes will start to feel slow on
   mobile, since the whole file downloads before search works. If the list
   grows that large, the fix is a lightweight static search index (still no
   database, still no server) rather than a full backend. Flagging it now
   so it's not a surprise later.

## Security notes (v0.2 update)

- **Fixed: unescaped CSV data going into the page.** The grave locator was
  building HTML by dropping CSV fields straight into `innerHTML` and into
  attribute values. Since `graves.csv` is meant to be hand-edited by
  non-technical staff indefinitely, a stray `<` or `"` in someone's notes
  field would have broken the page, and a deliberately malicious entry could
  have injected a script. `assets/js/grave-locator.js` now escapes every CSV
  field before it touches the DOM.
- **Fixed: CDN dependencies replaced with vendored copies.** Leaflet and
  PapaParse now ship inside `assets/vendor/`, loaded from the same origin as
  the rest of the site, nothing executes from a third-party CDN at runtime.
  This matters for a government host specifically: outbound CDN calls are
  often blocked or flagged by that kind of environment's network policy, and
  it removes the supply-chain risk of a compromised or swapped CDN file. Only
  two things still load from outside the site: the OpenStreetMap map tiles
  (unavoidable, that's the map imagery itself, not executable code) and
  Google Fonts (low risk, easy to self-host later if you want zero external
  calls at all).
- **No accounts, no server, no database** means there is no login to brute
  force, no session to hijack, no SQL/NoSQL injection surface, and no stored
  personal data beyond what's already public in the CSV. That's the biggest
  structural security advantage of this MVP shape.
- **What's still worth a proper look before this goes anywhere near
  production**, and none of it is done yet:
  - A **Content-Security-Policy** header restricting script sources to
    same-origin, set at the web server level (I can't set HTTP headers from
    inside static files. This needs to be configured on whatever serves
    the site).
  - HTTPS enforced at the hosting/CDN level (not something the front-end
    code controls).
  - If/when a write-capable backend gets added later (see the pray/CSV
    discussion), that endpoint becomes the actual attack surface to review.
    rate limiting, input validation, and abuse prevention all become relevant
    at that point in a way they currently aren't for a fully static site.

## Deployment on a government server

No build step, no `node_modules`, nothing to compile. The whole `project/`
folder is the deployable unit. Point the web server's document root at it.
The only outbound calls the browser makes are to Google Fonts, OpenStreetMap
tile servers, and the Leaflet/PapaParse CDN scripts; if the hosting
environment blocks outbound CDN calls, those three can be vendored locally
instead (worth asking IT about before launch).

## Suggested next round

Once you have DGA Figma access, the real logo, real bio/article copy, and
the real grave list: send screenshots of the actual site (as you mentioned
you will) and we'll diff this against them and correct anything that's off,
starting with `tokens.css`.

## Round 3 changes (restructure: pray page, no more search, Vercel-specific fixes)

**Security incident**: live Upstash/Redis credentials were pasted into chat
during this round. If that's your production database, rotate those
credentials from the Upstash dashboard (linked from Vercel's Storage tab)
before relying on them. Nothing in this codebase reuses the actual values
that were shared.

**Corrected environment variable names.** Vercel's Upstash Marketplace
integration names its variables `KV_REST_API_URL` / `KV_REST_API_TOKEN` (it
also provides `REDIS_URL`, unused here). The endpoint now checks for those
names first, falling back to `UPSTASH_REDIS_REST_URL` /
`UPSTASH_REDIS_REST_TOKEN` if you ever set it up manually instead of through
the Marketplace. This is almost certainly why the connection seemed like it
wasn't working, the Vercel side was fine, the code was checking the wrong
variable names.

**`/api/testimonies.js` is now `/api/prayers.js`.** Same design (rate
limiting, duplicate guard, admin-token delete), extended with an optional
`verse` field. The GET response's array length is now the real, shared
prayer count across all visitors, since it's backed by Redis there's no
reason to fake a local-only counter anymore.

**`testimonies.html` is now `pray.html`**, and it does more: pick a curated
verse (or Random), the verse opens on quran.com in a new tab to read or
listen, then optionally add a name and a short word, submit. There's also a
"Go to the donation page" link and a live feed of everyone's prayers.
**Delete `testimonies.html` and `assets/js/testimonies.js`** if you're
merging these files into an existing checkout rather than replacing the
whole folder, they're gone from this version.

**Quran audio: I checked, and changed the plan.** The approach I'd have
used from memory (a public, unauthenticated Quran.com API call) no longer
works, that API now requires backend OAuth credentials (client ID/secret)
registered with the Quran Foundation. Rather than guess at an endpoint I
couldn't verify and risk it silently failing on a grieving family's page,
verse selection deep-links to the exact verse on quran.com instead, which
has its own reliable player. True inline audio is a reasonable phase-2 if
you register for their API credentials (see api-docs.quran.com) and want to
add a small server-side proxy, similar in shape to `/api/prayers.js`.

**The curated verse list (`assets/data/verses.js`) needs review.** It's
sourced from commonly-cited verses/duas for the deceased (Surah Al-Fatiha,
Ayat al-Kursi, Surah Yaseen, Surah Al-Ikhlas, and two duas from Quran.com's
own "Duas for the Dead" page), not something I should finalize unilaterally.
Practice varies by school of thought, please have someone with religious
authority review this list before it's live.

**Home page**: the vision/mission/values cards are gone (agreed, they read
as corporate boilerplate on a memorial site). That space now shows a
horizontally scrolling feed of real prayers (verse chosen + message, pulled
live from `/api/prayers`). The hero leads with "Pray for him" as the
primary action instead of requiring a scroll to find it, and now includes
his portrait (see the placeholder-image note below).

**Grave locator**: search-by-name-and-date and pagination are gone, this is
a single-person site, they never made sense here. In their place: a
directions module. Visitors can type a starting point or tap "use my
location" (only on click, never automatically), then get real Google Maps
(transit mode) and Apple Maps deep links to the grave's coordinates. This
does not attempt to reproduce live metro/bus schedules ourselves, Google
Maps already has real transit data for supported cities, so the deep link
asks it to do that work. A small note also points to the official Darb app
for exact, current Riyadh metro/bus times, since transit coverage and
accuracy varies by city and by data source.

**Footer copyright year** is now set by JavaScript
(`assets/js/common.js`, any element with `data-current-year`) instead of a
`[year]` bracket placeholder that would've gone stale every January.

**Placeholder portrait**: `assets/img/placeholder-portrait.svg` is an
abstract vector illustration, not a photograph. I didn't pull a stock photo
because I can't verify licensing on images from a search, and a "blurred
face, trimmed background" stock photo still carries someone's actual
likeness and a license I can't confirm. The SVG sidesteps both problems
entirely and is trivially easy to swap for the real photo later, just
replace that file (or point the `<img>` tag in `index.html`'s hero at a new
file) once you have one you're happy with.

### Files changed this round

New: `api/prayers.js`, `pray.html`, `assets/js/pray.js` (rewritten, was the
old device-local pray button logic, now the full pray-page logic),
`assets/data/verses.js`, `assets/img/placeholder-portrait.svg`.

Deleted: `api/testimonies.js`, `testimonies.html`, `assets/js/testimonies.js`.

Modified: `index.html`, `grave-locator.html`, `assets/js/grave-locator.js`,
`assets/js/i18n.js`, `assets/js/common.js`, `assets/js/admin.js`,
`admin.html`, `assets/css/main.css`, and the nav link plus footer year on
`knowledge-hub.html`, `article-dua.html`, `article-visiting.html`,
`donate.html`, `privacy.html`.

## Round 4: real data, visual redesign

**Real content is in now.** Name: عبدالله محمد العجلان / Abdullah Mohammed
Alajlan (full form, used on the grave record). Site-wide references use the
shorter عبدالله العجلان / Abdullah Alajlan. Death date: 10 September 2026
(17 Safar 1448H), confirmed from the stone-plaque proof image. Grave
location: Column 20, Row 58.

**Still needed from you: the actual coordinates.** The Google Maps short
link (`maps.app.goo.gl/...`) can't be resolved from here, Google blocks
automated access to it, and it's not indexed anywhere I can search. The map
and the "Get Directions" buttons on the grave locator page won't work until
real numbers replace the `REPLACE_LAT` / `REPLACE_LNG` placeholders in
`assets/data/graves.csv`. Easiest way to get them: open that link on a
computer, right-click the pin on the map, choose "What's here?", and Google
shows the exact latitude/longitude, or check the URL bar after it loads,
it usually contains `@24.xxxx,46.xxxx` somewhere in it.

**Visual redesign: aura/glassmorphism.** The hero moved from a solid dark
green background to a soft warm gradient (blush/peach/sage), with a faded
abstract architectural silhouette behind it, echoing the reference image
you shared. That silhouette is a generic illustrated shape, not a real
building or a stock photo, same reasoning as the portrait: I can't verify
licensing on an image pulled from a search, and it's trivial to swap for a
real photo you own the rights to later, just replace
`assets/img/arch-silhouette.svg`. A `.glass` utility class (translucent
background plus backdrop blur) is now used on the hero buttons, the
prayers feed cards on the home page, and the directions box on the grave
locator page. `--color-aura-*` and `--glass-*` tokens are in `tokens.css`
if you want to adjust the palette.

**On stock photos of religious places**: same answer as the portrait, I
won't embed a photo from a search result as a permanent site asset without
being able to verify its license, that's a real legal exposure for a
client site, not just a style preference. If you or the family have your
own photos (or a stock subscription you've paid for), those drop in
cleanly, happy to wire them in.

**QR code**: noted that you're adding one to the physical stone, pointing
to the website. I didn't generate it yet since encoding the wrong URL onto
carved stone is expensive to fix, tell me exactly which page it should
point to (the grave locator page is the natural fit) and your final live
domain, and I'll generate it.

## Round 5: title bug, favicon, footer/donation/articles, security incident

**Security incident: a live GitHub personal access token was pasted into
chat during this round**, same category as the Round 3 Redis-credentials
incident. It turned out to be read-only (couldn't push), which is why the
work this round was handed back as a zip/patch instead of pushed directly.
Rotate it from GitHub Settings -> Developer settings -> Personal access
tokens regardless, read-only tokens are still credentials.

**Fixed: browser tab title showed raw markup.** Every page's `<title>` was
`<title><span class="i18n-ar">...</span><span class="i18n-en">...</span></title>`,
which doesn't work, a `<title>` element can only hold plain text, so the
browser tab literally showed the `<span>` tags. Moved the AR/EN strings to
`data-title-ar` / `data-title-en` on `<html>`, and `assets/js/i18n.js` now
sets `document.title` from those on load and on every language toggle.

**Added a favicon.** `assets/img/favicon.svg` plus PNG fallbacks
(`favicon-32.png`, `favicon-180.png`, `favicon-192.png`), a small circular
crescent-and-dot mark in the site's own green/gold tokens, not a generic
icon. Linked in every page's `<head>`.

**Footer redesign (first pass, refined further in Round 7).** Removed the
separate "Supported by" heading and the white rectangular logo chips;
removed the "digital trust stamp (pending certification)" placeholder
entirely rather than show a badge with nothing real behind it.

**Grave locator: two real bugs fixed.**
- The map pin's popup name (Arabic/English) was only ever set once, at
  `initMap()`. Switching languages afterward left it showing whatever
  language was active on first load. Split into a separate
  `updateMarkerPopup()` function, called on every `langchange` event now.
- Switching languages repeatedly was silently stacking duplicate click/input
  listeners onto the directions box (every `renderGrave()` call re-ran the
  whole binding function). Split into `bindDirectionsListeners()` (runs
  once, guarded by a flag) vs. label updates (run every language switch).

**Donate page: went from static text to a real form.** Amount presets,
custom amount, name, email, all validated client-side. Submission is
gated on `DONATION_CAMPAIGN.apiEndpoint` in `assets/data/donation.js`:
`null` right now, which shows an honest "payment gateway isn't connected
yet" message instead of pretending to process anything. Once the client
provides a real gateway endpoint, that one config value is the only thing
that needs to change, the `fetch()` call and payload are already written.

**Knowledge hub articles rewritten.** Both were `[Editable text]`
placeholders one or two lines long. Now real, fuller content (ways to pray
for the deceased, etiquette of visiting graves), same caveat as the verse
list in Round 3: **needs review by someone with religious authority**
before treating the wording as final, I'm not qualified to be the
authority on that content, only to draft something reasonable to review.

**preview-home.html synced** to match the footer/title/favicon changes
above, it's still a standalone convenience file (see "Getting a live
preview" below), not wired to the real site's JS.

## Round 6: fixes to Round 5's own footer/search/donation work

**Grave locator search button did nothing visible, now actually does
something.** It was quietly updating `href` attributes on two buttons
further down the page, invisible unless you happened to notice those
buttons changed. Pressing Search (or Enter) now directly opens Google
Maps (Apple Maps on iOS) in a new tab with directions from the typed
address, immediately. Shows an inline message if no starting point has
been given yet instead of failing silently.

**Donation progress figure was wrong.** `42,500` SAR raised was
placeholder/example data from Round 5's own build, not real, and wasn't
flagged clearly enough at the time to make that obvious. Zeroed to `0`
raised / `200,000` SAR target in `assets/data/donation.js`, waiting on the
actual numbers.

**Footer logos made bigger** (22px to 34px), the Round 5 chips were too
small to actually see. Superseded by the no-chip approach in Round 7.

## Round 7: footer logos on transparent background, real crescent, banner consistency, scrollbar fix

**Footer logos redone again, this time to match the reference site's
approach directly**: no card/chip behind them at all. `filter:
brightness(0) invert(1)` turns the AWQAF/NCNP marks into a flat white
silhouette that reads fine straight on the dark green background, same
visual language as the reference footer that was shared for comparison.

**The floating footer ornament went through three attempts before landing:**
a 14px crescent icon (too small to read, Round 5) -> a shapeless ambient
glow (had no legible form, "too blurry", Round 6) -> an actual crescent
shape at a real size (~140px) with a soft drift animation (Round 7, current).
It's a proper SVG crescent path (the well-known "moon" icon shape,
`fill-rule` evenodd tricks didn't render reliably across the two earlier
attempts, this path doesn't need one), at low opacity so it stays
background texture rather than competing with the actual content.

**Page-hero banner was inconsistent across subpages, now fixed.**
`donate.html`'s banner had a different (taller) top/bottom padding than
every other subpage, from a missing `padding-block: var(--space-6)`
override the rest of the pages shared. `privacy.html` had no gradient hero
banner at all, just plain text with no `page-hero` section. Both now match
the rest structurally (remaining height differences between pages are just
from differing amounts of subtitle text, that part is expected).

**Fixed a scrollbar flash during page-load animations.** Elements using
the `.reveal` fade-up-on-scroll effect start slightly below their resting
position (`translateY(18px)`); a `.reveal` element near the bottom of a
page could transiently push the page's scrollable area a few pixels past
viewport height before settling, which flashes the browser's vertical
scrollbar in and out. Added `scrollbar-gutter: stable` globally (in
`assets/css/main.css`, on the `html` rule), which reserves that space
permanently instead of only when actually needed.

### Files changed, Rounds 5-7

Modified: `index.html`, `grave-locator.html`, `pray.html`,
`knowledge-hub.html`, `donate.html`, `article-dua.html`,
`article-visiting.html`, `privacy.html`, `admin.html`,
`preview-home.html`, `assets/css/main.css`, `assets/js/i18n.js`,
`assets/js/grave-locator.js`, `assets/js/donate.js`,
`assets/data/donation.js`.

New: `assets/img/favicon.svg`, `assets/img/favicon-32.png`,
`assets/img/favicon-180.png`, `assets/img/favicon-192.png`.

## Still open, updated

Carried over from earlier rounds, still not done:
- **Nearest metro/bus/route for the graveyard-visiting enhancement.**
  Unchanged since Round 1, still pending your decision on linking to
  official journey planners vs. custom routing.
- **Quran verse audio for Blessing Sharing.** Unchanged since Round 3,
  still needs Quran Foundation API credentials plus your call on which
  verses/reciter, see the Round 3 note above.

New from this stretch of rounds:
- **`privacy.html` is now inaccurate and should be rewritten.** It states
  the site "does not collect personal data." That stopped being true in
  Round 3 (prayer name/message, stored server-side) and again in Round 5
  (donation form asks for name/email, though nothing is sent anywhere
  with it yet since there's no gateway or email service connected). This
  needs a real rewrite covering what's collected, where it's stored, how
  long it's kept, and how to request removal, not a quiet patch.
- **Testimony/prayer editing isn't built, only deleting.** `admin.html` has
  a Delete button per entry (calls `/api/prayers` with the admin token).
  There's no Edit. The only way to change a testimony's wording today is
  a raw Redis command in the Upstash console (Vercel dashboard -> Storage
  tab -> your database -> Data Browser, the entries live in a list under
  the key `prayers:list`, one JSON object per entry), which is easy to get
  wrong by hand. Worth a proper Edit button in `admin.html` if this comes
  up with any regularity.
- **Death date mismatch, still unresolved.** The bio text on the home page
  and `assets/data/graves.csv`'s `death_date` field both say 15 May 2026.
  Round 4's notes say the confirmed date (from the stone-plaque proof
  image) is 10 September 2026 (17 Safar 1448H). One of these is wrong and
  I haven't touched either, flagging it rather than guessing which.
- **Donation figures are placeholders.** `0` raised / `200,000` SAR target
  in `assets/data/donation.js`, needs the real numbers.
- **Email field on the donate page isn't functional.** It's captured in
  the browser but never sent anywhere (no email service is wired up, and
  submission is gated on the payment gateway anyway, which doesn't exist
  yet). The "to send your donation receipt" copy next to it is aspirational
  until both of those exist, worth softening that wording if the form goes
  live before the gateway does.

