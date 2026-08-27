# Independent verification — FAIL

- Work order: `photo-stack-proof-verify-1`
- Candidate: `15104a7248fd3db60ce866c2b6f85ce4bd6c2fe6`
- Live URL: <https://photo-stack-proof.sociobot.in>
- Verified: 2026-08-27
- Scope: clean detached checkout at the candidate; production build; local and
  live-browser PWA checks. No product source was modified.

## Verdict

**FAIL.** The normal analysis and offline PWA flows work, and the live bytes
match the candidate exactly. However, the required invalid-input recovery path
is incomplete: a malformed v1-shaped JSON report is saved before it is fully
validated, produces a partially rendered report, and remains broken after a
reload. The deployment also does not meet the PWA long-lived immutable asset
caching requirement.

## Defects

### P2 — malformed imported reports are persisted and leave the UI broken

`src/main.ts:302-306` accepts a JSON object when only `version`, `createdAt`,
and `groups` are superficially present, saves it to IndexedDB, then attempts to
render it. This is insufficient schema validation for an import endpoint.

Reproduction against the exact production build:

1. Open the app and use **Import prior JSON report**.
2. Import `{"version":1,"createdAt":"not-a-date","groups":[{}]}`.
3. The visible status says `Report import failed. Cannot read properties of
   undefined (reading 'length')`, but the Evidence report section has already
   become visible and is partially invalid.
4. Reload. The bad report is restored from IndexedDB; the results section stays
   visible and the status is blank rather than recovering to a usable empty
   state.

This fails the work order's invalid-input/recovery requirement. Validate the
full report/group/file schema before `saveCurrent`, reject invalid data without
changing the current report, and handle corrupt stored reports by deleting or
ignoring them with a clear recovery message.

### P2 — live hashed assets lack immutable caching

On the live URL, both immutable-name build assets return:

```
cache-control: public, must-revalidate, max-age=30
```

This was observed for `/assets/index-DlfsDJ9P.js` and
`/assets/index-CW74brTa.css`. The PWA/performance contract calls for long-lived
immutable caching for hashed assets. Configure the deploy/CDN to use, for
example, `public, max-age=31536000, immutable` for hashed `/assets/*`; retain a
short/no-cache policy for HTML and `/sw.js` so updates continue to be found.

### P3 — response-policy hardening is incomplete

The live HTML and asset responses have HSTS, `nosniff`, and a restrictive
referrer policy, but no `Content-Security-Policy`, `Permissions-Policy`, or
clickjacking protection header (`frame-ancestors` or `X-Frame-Options`).
`/manifest.webmanifest` is also served as `application/octet-stream`, not a
web-manifest JSON type. These did not block the normal product flow, but should
be corrected in deployment configuration.

## Evidence that passed

### Clean checkout and quality gates

From a fresh detached worktree at the candidate:

```sh
npm ci                         # 175 packages, 0 vulnerabilities
npm test                       # 8/8 passed
npm run build                  # passed; dist/ created
npm run test:e2e               # 12/12 passed after installing declared Chromium
```

`npm run build` includes `tsc -b`; there is no separate lint script in
`package.json`. The first e2e invocation correctly reported that the disposable
container had no Playwright Chromium. After `npx playwright install --with-deps
chromium`, all desktop and 390x844 mobile tests passed.

Build output: JS 102,038 B raw / 36.25 KB gzip, CSS 15,256 B raw / 4.42 KB
gzip, mobile hero 26,052 B. These satisfy the 200 KB JS, 50 KB CSS, and 300 KB
hero budgets.

Independent Lighthouse against the exact local production build (mobile
defaults): performance 93, accessibility 100, best practices 100, SEO 100;
LCP 1,576 ms, FCP 1,118 ms, CLS 0, TBT 318 ms, transferred 132,746 B.

### Product journeys and boundaries

- Matching XMP/JSON `ContentIdentifier` sidecars analyze as **verified** and
  export CSV.
- Different same-kind strong IDs analyze as **conflict** with “Do not stack this
  group.”
- Timestamps one second apart without IDs analyze as **ambiguous**, never safe.
- The supplied unit suite covers far-apart timestamps as conflicts; the provided
  browser suite covers matching-sidecar analysis/CSV export, offline reload,
  mobile layout, accessibility, privacy, and returned-license handling. The
  malformed-shape import above exposes the additional recovery defect.
- A synthetic 100-group browser smoke check (90 same-basename ID collisions and
  10 matching pairs) reported exactly 90 conflicts, 0 ambiguous, and 10
  verified. This validates the rule engine only; it is not a substitute for the
  brief's camera-diverse labelled corpus.
- Valid invalid JSON `{}` displays the recoverable “not a Photo Stack Proof v1
  report” message and does not exercise the malformed-shape defect.

### Accessibility, UI, and privacy

- Local desktop and 390 px mobile: one `h1`, one `main`, `lang=en`, title,
  no horizontal overflow (390/390), visible 3 px focus ring, keyboard-reachable
  filter control, and reduced-motion transition duration of 0.00001 s.
- Axe found no serious or critical issues independently on home, `/privacy`,
  and `/terms`; no console or page errors were observed in normal use.
- Live home also had no serious/critical axe finding, console/page errors, or
  third-party requests. Its requests were only the product document, hashed JS,
  CSS, and local hero image. Static review confirms no analytics, CDNs, or
  file/report metadata requests; only optional license verification targets the
  documented Sociobot API.

### PWA and deployment identity

- Local offline: loaded once, waited for service worker activation, disabled
  the network, and reloaded successfully.
- Live offline at 390 px: after first load/service-worker activation, offline
  reload showed `Same name. Prove the stack.`, `OFFLINE · ON-DEVICE`, no errors,
  and 390/390 width.
- Service-worker update: a temporary test server served the candidate build and
  a changed `sw.js` version on `registration.update()`. The app showed “Update
  available. Reload”; pressing Reload left the new controller activated with no
  errors.
- Live deployment matches the candidate exactly. SHA-256 matched for the
  HTML-referenced JS and CSS, `sw.js`, manifest, offline page, and mobile hero
  asset. Live `index.html` references the exact candidate hashes
  `index-DlfsDJ9P.js` and `index-CW74brTa.css`.

## Notes / next action

Fix the P2 report-schema validation and deployment caching, then rerun this
verification against a new commit. A real labelled iPhone/RAW/video corpus is
still needed to substantiate the brief's 90%-separation success measure across
camera formats.
