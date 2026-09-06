# Verify photo stacks before importing — verification 3

- Work order: `photo-stack-proof-verify-3`
- Verdict: **FAIL**
- Findings: **7** (1 P1, 3 P2, 3 P3)
- Untested public claim families: **1**
- Implementation candidate: `35fb5b8f6dbe5c4f2fe2ef2ce01c00f3e9689c7c`
- Documentation candidate: `585e201a8df56b104165937f07ccf4685021ced5`
- Live URL: <https://photo-stack-proof.sociobot.in>
- Verified: 2026-09-06 UTC

## Job, audience, and first action

Before scrolling, fresh desktop and 390 px phone browsers showed:

- Job: **Verify photo stacks before importing**.
- Audience: photographers checking iPhone, RAW, and export folders before a
  DAM groups same-name files.
- First action: **Try it with sample data**.

The action and all three first-screen facts were inside both initial viewports.
The page started at scroll position zero with no horizontal overflow.

## Verdict

**FAIL.** The analyzer, sample sandbox, exports, normal persistence, deliberate
404 response, update notice, and ordinary offline reload work. The release
still has seven findings. The advertised purchase cannot start, a visited 404
can replace the cached offline home page, and dark mode has serious contrast
failures. Four smaller contract failures also remain.

## Findings

### P1 — the advertised $19 purchase still returns HTTP 404

The live **Buy Proof Archive** link points to:

`https://api.sociobot.in/api/v1/products/photo-stack-proof/checkout`

A fresh GET returned HTTP 404 with
`{"error":"enabled factory product","status":404}`. The page calls this a
“$19 one-time purchase,” so a visitor can reasonably expect the buy action to
start checkout. The free analyzer remains usable. Registration is external to
this static repository, but it is still a broken public user path and blocks a
product PASS.

The product's invalid-license endpoint does work: it returned HTTP 200 with an
invalid verdict, and the live client removed the token from the URL, stored it,
and showed **License no longer active. The free analyzer and exports still
work.**

### P2 — visiting a 404 replaces the cached offline home page

The service worker writes every network navigation response into the
`/index.html` cache key without checking `response.ok`. Azure's designed 404
response is therefore cached as the app shell.

Reproduction in a fresh live browser:

1. Load `/`, wait for the service worker, and reload so the page is controlled.
2. Open `/not-a-real-page`; the designed page correctly returns HTTP 404.
3. Go offline and open `/`.
4. The offline response is HTTP 404 with title **Page not found — Photo Stack
   Proof** and heading **Page not found**, rather than the analyzer.

This makes the public “Works offline after the first visit” claim false after a
normal error route. The declared offline claim command passed, but it covers
only a home-to-home reload and does not cover failed-navigation recovery.
Evidence: `/work/.evidence/offline-after-404.json`.

### P2 — dark mode has serious text contrast failures

Independent axe checks with `colorScheme: dark` found serious contrast
violations on `/` and `/demo`. The workbench flips to a light background while
several children keep light-on-dark colors. Measured examples include:

- workbench label and guidance: `#b7c6bd` on `#f5f1e7`, **1.57:1**;
- **Choose candidate files**: `#101714` on `#1c2923`, **1.2:1**;
- demo analysis status: `#d7e1da` on `#f5f1e7`, **1.18:1**;
- **Have a license? Restore it**: `#5ed6af` on `#fffdf7`, **1.76:1**.

The contract requires 4.5:1 for ordinary text and 3:1 for large text. Light
mode had no axe violations. Evidence: `/work/.evidence/axe-dark.json` and
`/work/.evidence/dark-home.png`.

### P2 — paid-offer claims are absent from the claim registry

The first screen, pricing section, Terms, and README state that Proof Archive
is a **$19 one-time purchase**. The pricing list also says **Unlimited named
report snapshots**, and the page presents a buy action.

`.factory/claims.json` has a `paid-archive` claim only for restoring a recorded
valid license and saving one local snapshot. Its test mocks verification. It
does not declare or test the price, one-time purchase, unlimited quantity, or
the ability to start checkout. This is one untested public claim family. It is
also presently false at the live checkout, as recorded in the P1 finding.

All nine declared claim commands themselves passed.

### P3 — populated reports skip a heading level

On `/demo`, axe reports a moderate `heading-order` violation. The evidence
report has an `h2`, then each open file record begins at `h4`; there is no `h3`
between them. The first reported node was `IMG_6043.xmp`. This affects the
sample and any populated real report. The accessibility contract requires
headings in order. Evidence is also in `/work/.evidence/axe-dark.json`; the
same violation occurs in light mode.

### P3 — the live static 404 has no skip link

The designed `/not-a-real-page` response correctly returns HTTP 404 and has a
title, one `h1`, one `main`, a home action, and a footer. Its standalone
`404.html` does not include the required **Skip to main content** link and does
not use the site's full navigation header. This is missing required structure,
not a complaint about the deliberate HTTP 404.

### P3 — the update action is only 26.8 px high

The service-worker update path works and shows **Update available. Reload**.
The visible **Reload** button measured 66.4 × 26.8 CSS pixels. It is below the
44 × 44 px touch-target baseline. Evidence:
`/work/.evidence/update-check.json`.

## Sample and real-data isolation

Fresh desktop and phone browsers opened `/demo` in one click. The first
populated screen contained three realistic groups:

- `img_6042`: verified by a matching content identifier;
- `img_6043`: conflict with **Do not stack this group** guidance;
- `img_6044`: ambiguous because timestamps alone are not proof.

The sticky label read **Demo — sample data, nothing is saved to your real
report.** It remained visible at the bottom of the page. **Clear this demo
report** stated that the real report was unchanged. **Reset demo** restored all
three groups.

On desktop, I first created a normal verified report named `real_0001`. After
clearing and resetting the demo, **Start for real** restored that exact normal
report. The demo made no cross-origin requests. This proves the earlier
real-data-isolation finding is resolved.

## Clean-checkout quality gates

The checks ran from a detached checkout of documentation commit `585e201`.
That commit contains implementation `35fb5b8`; later repository head changes
only Graphify output.

```text
npm ci              PASS — 175 packages, 0 vulnerabilities
npm test            PASS — 14/14
npm run build       PASS — dist/ produced
npm run test:e2e    PASS — 34/34 desktop and 390 px phone
```

The build produced 111,099 B JavaScript (38.89 KB gzip), 16,618 B CSS (4.66 KB
gzip), and a 26,052 B mobile hero. These are within the declared budgets.

Every `.factory/claims.json` command was then run separately from that clean
checkout. Each ran its tagged test in both browser projects:

| Claim | Result |
| --- | --- |
| `local-analysis` | PASS, 2/2 |
| `classification` | PASS, 2/2 |
| `selected-files-remain-unchanged` | PASS, 2/2 |
| `local-privacy` | PASS, 2/2 |
| `exports` | PASS, 2/2 |
| `local-persistence` | PASS, 2/2 |
| `offline-reload` | PASS, 2/2; incomplete boundary coverage noted above |
| `paid-archive` | PASS, 2/2 with recorded verification; public offer claims remain uncovered |
| `camera-corpus` | PASS, 2/2 |

## Live functional evidence

- Normal and boundary input: five candidate groups produced one verified, two
  conflicts, and two ambiguous results. Timestamps one second apart stayed
  ambiguous; timestamps two hours and one second apart produced a conflict.
- Invalid and recovery input: malformed v1 JSON was rejected without replacing
  the good five-group report, and reload restored that report.
- Corrupt media: invalid JPEG and MOV input stayed ambiguous; the JPEG showed a
  visible **Metadata could not be read** note.
- Empty input named the next step. A singleton-only set explained that one
  unique basename was ignored.
- CSV and JSON downloads, local persistence, source-file byte preservation,
  and the 100-group camera corpus passed their declared checks.
- Keyboard: the skip link was first in tab order and appeared with a 3 px focus
  ring after its reduced-motion transition settled. Other controls had the
  same designed focus ring; no trap was found.
- Reduced motion used effectively instant transitions and automatic scrolling.
- A 200% desktop-scale layout check on `/`, `/demo`, `/privacy`, and `/terms`
  had no horizontal overflow. The 390 px phone layout also had none.
- `/`, `/demo`, `/privacy`, and `/terms` returned HTTP 200 with route-specific
  titles, canonical URLs, one `h1`, and one `main`.
- `/not-a-real-page` returned the expected HTTP 404 and designed page. Its
  missing skip link is recorded above.
- Home, demo, Privacy, Terms, robots, sitemap, and source links returned 200.
  Only the advertised checkout link returned an unexpected 404.
- The live home and demo made no unexpected console or page errors. Chromium
  logged only the expected failed-resource message while deliberately loading
  the HTTP 404 document.
- Normal offline reload passed on phone. The update notice also worked. The
  404-cache recovery defect is recorded separately above.

`verify-url.sh` passed with HTTP 200, title, `lang=en`, one `h1`, `main`, alt
text, and no console errors. Light-mode axe found no violation on home,
Privacy, or Terms and the one moderate heading-order violation on populated
demo. Dark-mode results are recorded in the findings.

Lighthouse wrote a complete mobile report before its known post-audit browser
tab crash: Performance 100, Accessibility 100, Best Practices 100, SEO 100;
FCP 1.13 s, LCP 1.58 s, TBT 0 ms, CLS 0, transferred 142,236 B. Direct browser
monitoring was clean.

## Live candidate identity and response policy

The live document references `index-DW2KVV7R.js` and `index-C9HGA-yE.css`, the
same names produced from the clean candidate. SHA-256 values matched for
`index.html`, JavaScript, CSS, `sw.js`, and `404.html`.

Live HTML, manifest, and service worker revalidate. Hashed JavaScript uses
`public, max-age=31536000, immutable`. The manifest has
`application/manifest+json`. CSP, Permissions Policy, referrer, `nosniff`, HSTS,
and clickjacking protections are present. This proves the old cache, MIME, and
response-policy findings remain resolved.

## Earlier findings and current disposition

| Earlier finding | Current disposition |
| --- | --- |
| Malformed imported reports persisted | Resolved; exact regression passed locally and live. |
| Hashed assets lacked immutable caching | Resolved on live responses. |
| CSP, permissions, clickjacking, and manifest MIME were incomplete | Resolved on live responses. |
| Demo was absent and shared real storage | Resolved; isolated storage and real-report preservation proved live. |
| Checkout returned 404 | **Open**, P1 above. |
| Claim registry and tagged tests were absent | Mostly resolved; all nine declared commands pass, but the paid-offer family is still unlisted. |
| First-screen audience, facts, and plain copy were missing | Resolved; desktop and phone first screens pass. |
| Unknown routes returned home with HTTP 200 | HTTP behavior resolved; the static 404 structure and offline cache interaction have current findings. |
| Route titles and sharing metadata were incomplete | Resolved. |
| Camera-diverse corpus was missing | Resolved; declared 100-group corpus test passed. |
| Header and footer controls were below 44 px | Resolved for those controls; the update action has a separate current finding. |
| Corrupt-media errors were hidden | Resolved; visible live read note proved. |

## Scope notes

This is a static local-first PWA. Backend tenant isolation, SQLite restart
persistence, health endpoints, and 429/`Retry-After` behavior do not apply. The
deterministic evidence check does not need an AI feature, so there is no missed
AI step. No product code was changed during this verification.

## Required next work

1. Register or enable the owned one-time billing offer and prove that checkout
   starts at the advertised price.
2. Cache only successful navigation responses; add a claim regression for
   home → 404 → offline home.
3. Correct the dark workbench and restore-link colors, then run axe in both
   themes in CI.
4. Declare and test every paid-offer claim, or remove unsupported words such as
   **unlimited**.
5. Use sequential report heading levels, add the skip link/full header to the
   static 404, and make the update action at least 44 px high.
