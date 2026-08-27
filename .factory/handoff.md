# Photo Stack Proof — verification handoff

## Independent QA status: **FAIL**

Candidate `15104a7248fd3db60ce866c2b6f85ce4bd6c2fe6` was independently tested
from a clean checkout and compared to <https://photo-stack-proof.sociobot.in>
on 2026-08-27. The live deployment is byte-identical to the candidate and its
normal PWA flow passes, but release is blocked by two P2 defects:

1. A malformed but v1-shaped JSON report is persisted before full validation;
   it partially renders and remains broken after reload instead of recovering.
2. Live hashed JS/CSS assets use `max-age=30` rather than long-lived immutable
   caching required for this PWA.

There is also P3 response-policy hardening work (no CSP, Permissions Policy or
clickjacking policy; manifest served as octet-stream). Exact reproduction,
headers, test results, bundle/Lighthouse metrics, PWA update/offline evidence,
and deployment hashes are in `.factory/verification.md`.

To verify the candidate locally: `npm ci && npm test && npm run build && npx
playwright install --with-deps chromium && npm run test:e2e`. Do not release
until the P2 issues are corrected and independently retested.

---

# Original build handoff

Work order: `photo-stack-proof-build-1`
Completed: 2026-08-27

## What shipped

- A production Vite + TypeScript PWA that inspects user-selected files entirely
  in the browser; nothing is uploaded, renamed, moved, or deleted.
- Case-insensitive basename grouping for photos, RAWs, videos, XMP/AAE/JSON
  sidecars, with singletons counted separately.
- EXIF/XMP extraction for images, text/XMP extraction for sidecars, and bounded
  head/tail scanning for QuickTime/MP4 content identifiers so large videos are
  not loaded into memory in full.
- Conservative verdicts:
  - **verified** only when at least two files share the same supported strong ID;
  - **conflict** when the same ID field disagrees, or supported capture times are
    over two hours apart without shared strong evidence;
  - **ambiguous** for timestamp-only agreement or insufficient evidence.
- Expandable evidence rows, conflict-first sorting, verdict filters, readable
  reason text, progress/error/empty/restored/offline states, and free CSV + JSON
  export/import.
- IndexedDB persistence for the latest report. No photo bytes are stored.
- Installable offline PWA with manifest, 192/512/maskable icons, versioned app
  shell caching, offline navigation fallback, offline state messaging, and an
  update-available toast.
- $19 one-time Proof Archive upgrade through the Sociobot billing endpoint:
  checkout link, return-token capture, daily cached verification, optimistic
  cached offline access, license paste/restore, and locally stored named audit
  snapshots. No product ID or payment provider is embedded. Core analysis and
  both exports remain free.
- `/privacy` and `/terms`, MIT license, complete README, sitemap, robots file,
  and a product-specific design/provenance record.
- Original generative-geometry hero, generated with the factory Azure image
  deployment and reviewed for brands/text/artifacts. Sources and prompt sidecars
  are in `assets/src/`; responsive WebP outputs are 26 KB and 88 KB.

## Verification

Run from a clean dependency install:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Results on 2026-08-27:

- `npm test`: 8/8 unit tests passed. Covers basename normalization, strong-ID
  verification, mismatching IDs, timestamp-only ambiguity, far-time conflict,
  XMP parsing, end-to-end sidecar analysis, and CSV escaping.
- `npm run build`: passed; `dist/index.html` exists at the deploy root.
- Playwright: 12/12 passed across Desktop Chrome and a 390×844 mobile viewport.
  Covers no console/page errors, semantics, axe, local analysis + CSV export,
  offline reload, no horizontal overflow, privacy route, and mocked paid-license
  return/verification/storage.
- Axe via Playwright: no serious or critical violations on the home and privacy
  routes in either viewport.
- Offline: explicitly loaded once, waited for service-worker control, disabled
  the browser network, and reloaded the complete workbench successfully with the
  visible offline state.
- Lighthouse mobile against the production build:
  - Performance: **100**
  - Accessibility: **100**
  - Best practices: **100**
  - SEO: **100**
  - LCP: **1.5 s**; FCP: **1.1 s**; TBT: **0 ms**; CLS: **0**
- Production assets: initial JS 102.04 KB (36.25 KB gzip), CSS 15.26 KB
  (4.42 KB gzip), mobile hero 26 KB. These are inside the 200/50/300 KB budgets.

## Known limits

- Browser metadata support varies by format and camera implementation. In
  particular, proprietary RAW structures and nonstandard video metadata may
  yield “ambiguous”; this is the intended safe fallback.
- Video scanning reads the first 4 MB and last 8 MB, where QuickTime metadata is
  normally stored. A nonstandard identifier elsewhere in a very large file may
  not be found.
- The classifier has deterministic rule tests, but the brief’s 100-group,
  camera-diverse labelled validation corpus was not supplied. Before broad
  claims about recall, test against real exports from multiple iPhone, camera,
  and editing-app versions. The invariant that timestamps alone never verify is
  enforced and tested.
- Checkout creation itself depends on the factory registering the product at
  the production Sociobot endpoint. The client contract and a valid mocked
  verification response are tested; no live purchase was made in this build.

## Suggested next steps

1. Assemble the 100-group labelled fixture corpus described in the brief and
   publish per-format precision/recall results.
2. Add parsers only for formats that appear as false negatives in that corpus;
   do not weaken the shared-ID verification rule.
3. Register `photo-stack-proof` in the Sociobot billing system and run a staging
   checkout/refund/revocation pass before release.
