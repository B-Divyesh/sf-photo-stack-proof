# Independent verification 2 — PASS

- Work order: `photo-stack-proof-verify-2`
- Candidate: `1840591e53b1d12b2ba2ab434de3447f084561e6`
- Live URL: <https://photo-stack-proof.sociobot.in>
- Verified: 2026-08-27
- Scope: clean detached worktree at the candidate, exact production build, local
  and live browser/PWA checks. Product code was not modified.

## Verdict

**PASS.** The repair resolves the prior invalid-import, caching, and response
policy failures. The live app references the candidate's exact built JS/CSS
hashes; the live JS and service worker were byte-identical to the rebuilt
candidate. No release-blocking defect was found.

## Quality gates

```sh
npm ci                         # passed; 175 packages audited, 0 vulnerabilities
npm test                       # passed; 13/13
npm run build                  # passed; tsc -b + Vite, dist/ produced
npx playwright install chromium
npm run test:e2e               # passed; 14/14 desktop + 390 px mobile
```

There is no separate lint script. `npm run build` runs the available TypeScript
check. The initial Playwright run correctly failed only because this disposable
container had no browser binary; after installing the declared Chromium
dependency, the unmodified suite passed in full.

The production build is within the static-PWA budgets: initial JS is 105,910 B
raw / 37.52 KB gzip (budget 200 KB), CSS is 15,256 B raw / 4.42 KB gzip
(budget 50 KB), and the mobile hero image is 26,052 B (budget 300 KB).

## Independent product checks

- Normal workflow: matching XMP/JSON content identifiers produced **verified**;
  CSV export completed.
- Boundary and safety cases: close timestamps without an ID were **ambiguous**;
  different `ContentIdentifier` values were **conflict**; timestamps 2,192 days
  apart were **conflict**. No conflict was marked verified.
- Actual media parser path: two generated valid JPEG containers with matching
  EXIF `ImageUniqueID` and differing capture times produced **verified**.
- Corpus smoke check: 100 same-basename pairs (90 deliberately colliding ID
  pairs and 10 matching pairs) produced exactly 90 conflicts, 10 verified, and
  0 ambiguous. This validates the implemented rule, not camera-format recall.
- Invalid/recovery paths: empty selection gives actionable feedback; malformed
  v1-shaped JSON is rejected without replacing a good report; the good report
  persisted in IndexedDB and restored after reload.
- Desktop and 390 px mobile had no horizontal overflow. Keyboard Tab reached a
  visibly styled skip link/focus ring. Reduced-motion mode was effectively
  instant (0.00001 s animation duration).
- Axe reported no serious or critical findings in the repository desktop/mobile
  home and privacy tests, and independently on the live home page. Direct
  local/live browser monitoring observed no console or page errors.

## PWA, privacy, and deployment evidence

- Local and live: load once, wait for service-worker activation, disable the
  network, then reload. The cached app rendered its main heading successfully.
- Update check: a temporary QA server served the candidate build and a changed
  `/sw.js` response on `registration.update()`. The app showed **Update
  available. Reload**, confirming the update path; `skipWaiting` and
  `clientsClaim` are present in the candidate worker.
- Privacy: the normal workflow generated no outbound requests; files/reports
  remained in browser memory/IndexedDB. Static and runtime checks found no
  analytics, CDN, or metadata upload. The only allowed external endpoint is the
  documented Sociobot license API, and it is called only when a license exists.
- Live identity: `/` references `assets/index-D-rXpVMU.js` and
  `assets/index-CW74brTa.css`, exactly the rebuilt candidate names. SHA-256 for
  that JS and `/sw.js` matched the local build byte-for-byte.
- Live response policy: HTML, manifest, and service worker use
  `no-cache, max-age=0, must-revalidate`; hashed JS and CSS use
  `public, max-age=31536000, immutable`. Manifest MIME is
  `application/manifest+json`. Responses include HSTS, `nosniff`,
  `strict-origin-when-cross-origin`, CSP with `frame-ancestors 'none'`, a
  restrictive Permissions Policy, and `X-Frame-Options: DENY`.

Live Lighthouse mobile measured Performance **99**, Accessibility **100**, Best
Practices **96**, and SEO **100**; LCP 1,504 ms, CLS 0, TBT 120 ms. Lighthouse
printed a post-audit Chromium tab-crash warning and consequently marked its
console-error audit down; direct browser console/page-error monitoring was
clean.

## Defects and residual limits

No P0, P1, P2, or P3 defects were found.

- **P4 / coverage limit:** the repository has no camera-diverse, independently
  labelled iPhone/RAW/video corpus. The synthetic 100-group result demonstrates
  the conservative classifier but cannot substantiate format-wide recall. This
  does not undermine the safety guarantee: missing/unsupported evidence remains
  ambiguous rather than safe.
