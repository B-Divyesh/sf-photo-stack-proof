# Verify photo stacks before a DAM groups or deletes them

- Work order: `photo-stack-proof-review-1`
- Verdict: **FAIL**
- Findings: **9** (2 P1, 4 P2, 3 P3)
- Untested public claim families: **8**
- Implementation candidate: `8a781f013a8c0667fb81feff3c07e034a7c9ac89`
- Documentation/review commit inspected: `dd83e254ff4a924cb5248c5735816ab0652f5c3c`
- Live URL: <https://photo-stack-proof.sociobot.in>
- Reviewed: 2026-09-06 UTC

## What the product is for

The job is to check whether same-name photos, videos, RAW files, and sidecars
belong together before a DAM stacks them or a person deletes an original. The
audience is photographers reviewing old iPhone, RAW, and mixed export folders.
The first visible action is **Choose files to inspect**, which scrolls to a
second choice between a folder and individual files.

## Verdict

**FAIL.** The manual analyser, conservative labels, exports, local persistence,
offline reload, and accessibility smoke checks work. The required one-click
sample does not exist, `/demo` reads and can erase the normal report, and the
paid checkout returns HTTP 404. There are also unresolved claims, routing,
metadata, copy, touch-target, and recovery-feedback findings.

## Findings

### P1 — the required demo is absent and `/demo` is not isolated

There is no **Try it with sample data** action, sample dataset, persistent demo
label, **Reset demo**, or **Start for real** control. `.factory/demo.md` is also
missing. A fresh request to `/demo` returns the ordinary home app.

This is also a real-data isolation defect, not only a missing feature. In a
fresh browser context I created a normal report named `real_0001`, then opened
`/demo`. The route restored that report from the normal IndexedDB namespace.
Using **Clear this local report** on `/demo` removed it from `/` as well. The
demo contract specifically promises that demo activity never reads or changes
real data.

### P1 — the advertised $19 purchase cannot start

The live **Buy Proof Archive** link targets
`https://api.sociobot.in/api/v1/products/photo-stack-proof/checkout`. A normal
GET returned HTTP 404 with `{"error":"enabled factory product","status":404}`.
The free analyser remains usable, but the paid path advertised on the page is
broken. The earlier handoff called registration a dependency; it is still not
resolved in the live product.

### P2 — the mandatory claim registry is missing

`.factory/claims.json` does not exist and the repository contains no
`@claim:<id>` tests. Therefore none of these eight public claim families has
the required individually runnable sandbox test:

1. local analysis of supported photo, video, RAW, and sidecar metadata;
2. verified, ambiguous, and conflict classification rules;
3. no moving, renaming, deleting, or changing selected files;
4. no upload or analytics, with only license verification leaving the origin;
5. CSV and JSON exports;
6. local report persistence across refresh;
7. offline use after the first visit;
8. the $19 Proof Archive, named snapshots, and license restoration.

Ordinary unit/e2e tests and this review observed parts of these promises, but
they are not declared, tagged, or independently runnable as required. The
strict untested-claim count is **8**.

### P2 — the first screen and section copy do not meet the plain-words contract

The first screen explains the task and shows an action, but it does not name
the photographer audience or provide three short privacy/offline/price facts.
Its primary link only scrolls to another choice, so choosing files still needs
a second click. It also uses metaphor or mood copy prohibited by the contract:
“A local evidence bench,” “Bring the candidate files to the bench,” “One thread
can prove a stack,” and “Keep a migration paper trail.” The required
`.factory/copy-audit.md` is missing.

### P2 — unknown routes return the home page with HTTP 200

`/not-a-real-page` returned HTTP 200 and rendered the home screen. There is no
designed 404 document or `responseOverrides` entry. A deliberate 404 would be
expected and is not itself a defect; the defect is that no 404 is returned or
shown at all.

### P2 — route titles and required sharing metadata are incomplete

`/privacy`, `/terms`, and `/demo` all retain the home title, rather than their
required route-specific titles. The document has no canonical link, Open Graph
metadata/image, Twitter card metadata, or Apple touch icon link. `/demo` is not
listed in the sitemap. The footer also omits the required build/version ID.

### P3 — the earlier real-format coverage limit remains unresolved

The earlier review noted that no independently labelled, camera-diverse
iPhone/RAW/video corpus proves the 90-of-100 success target or the advertised
format coverage. That remains true. A synthetic live run with 100 sidecar
groups correctly produced 90 conflicts and 10 verified groups, but it does not
exercise real HEIC, RAW, QuickTime, or editor metadata. This is the earlier P4
limit carried forward as a current finding because this review requires zero
findings of every severity.

### P3 — several visible controls are smaller than 44 CSS pixels

On desktop, the wordmark is 32 px high and the Method and Proof Archive header
links are 22 px high. On the 390 px phone viewport, the wordmark is 35 px high
and the Privacy, Terms, and Source footer links are 25 px high. These miss the
44×44 px touch-target baseline. Focus rings themselves are visible and pass.

### P3 — corrupt-media read errors are hidden from the visible report

A pair containing an invalid JPEG and invalid MOV completes as **Ambiguous**.
The UI says only that evidence is insufficient and displays “Not found.” The
analyser records a JPEG parse warning internally and in export data, but the
visible evidence view never shows it. This does not tell the user whether
metadata was absent or could not be read, so the invalid-input guidance is
incomplete.

## Clean-checkout commands

Run from a detached worktree at documentation SHA `dd83e254`:

```text
npm ci                    PASS — 175 packages, 0 vulnerabilities
npm test                  PASS — 13/13
npm run build             PASS — dist/ created
npx playwright install chromium
npm run test:e2e          PASS — 14/14 desktop and mobile
```

The first e2e attempt reported the expected missing Playwright 1.62 browser.
After installing the documented Chromium prerequisite, the unchanged suite
passed. There is no lint command. There are no declared claim commands because
the required claim registry is missing.

Build output stayed within budget: JS 105,910 B raw / 37,182 B gzip; CSS 15,256
B raw / 4,429 B gzip; mobile hero 26,052 B.

## Live browser evidence

- Fresh Chromium contexts: desktop 1366×768 and Pixel 5 at 390×844.
- `verify-url.sh`: HTTP 200, title/lang/main/alt checks passed, zero console
  errors.
- Axe Playwright integration: zero violations on home, privacy, terms, demo,
  and the unknown-route response in both primary viewports.
- Keyboard: skip link appeared first; all ordinary controls were reachable;
  the designed 3 px focus outline was visible; no trap was found.
- Reduced motion: transition duration became `0.00001s` and smooth scrolling
  became instant.
- Normal output: three realistic sidecar pairs produced exactly one conflict,
  one ambiguous group, and one verified group with the correct explanations.
- Persistence and recovery: the report restored after reload; clear required
  confirmation and removed it; an empty selection gave a next step; the exact
  earlier malformed v1 import regression passed in both Playwright projects.
- Offline: after service-worker activation, desktop and phone reloads rendered
  the full app and showed **Offline · on-device**.
- Privacy: a full no-license analysis made no cross-origin request.
- Links: home, privacy, terms, and source returned 200; checkout returned 404.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1,170 ms, LCP 1,620 ms, TBT 32 ms, CLS 0.
- Live response policy passed: hashed assets use one-year immutable caching;
  HTML/manifest/service worker revalidate; manifest MIME and CSP, permissions,
  referrer, nosniff, frame-ancestor, and X-Frame-Options protections are present.

Evidence files are under `/work/.evidence/`, including `live-browser.json`,
fresh desktop/phone screenshots, verifier output, and Lighthouse JSON.

## Earlier findings and current disposition

- Malformed v1 import persistence: **resolved**. The regression passes locally,
  and live JS matches the rebuilt candidate.
- Hashed-asset caching: **resolved**. Live assets return
  `public, max-age=31536000, immutable`.
- CSP, permissions, clickjacking, and manifest MIME: **resolved** on live
  responses.
- Camera-diverse labelled corpus: **open**, recorded above as P3.
- Checkout registration dependency: **open and now directly user-visible**, as
  the live purchase link returns 404.

## Candidate identity

The live HTML, CSS, JavaScript, and service worker match the build from the
current checkout byte-for-byte. The JavaScript hash is
`21b4e4c6eb7c7ddd71054cfa576622cd42af08f2454fb1a9ecc8c90a64775fbc`.
The last commit that changes product code is `8a781f0`; later commits only
update handoff/verification or Graphify output, so the implementation candidate
is `8a781f013a8c0667fb81feff3c07e034a7c9ac89` and the reviewed documentation SHA
is `dd83e254ff4a924cb5248c5735816ab0652f5c3c`.

## Scope note

This is a static PWA, so backend tenant isolation, SQLite restart persistence,
health checks, and 429/Retry-After behavior do not apply. AI would not improve
the core deterministic identity check, so there is no missed AI feature.
