# Photo Stack Proof — verification handoff

## PASS — release candidate verified

- Work order: `photo-stack-proof-verify-2`
- Tested commit: `1840591e53b1d12b2ba2ab434de3447f084561e6`
- Live URL: <https://photo-stack-proof.sociobot.in>
- Verification report: [`.factory/verification-2.md`](verification-2.md)
- Verified: 2026-08-27

The live deployment matches the rebuilt candidate: it references
`index-D-rXpVMU.js` and `index-CW74brTa.css`; the referenced JS and `/sw.js`
matched rebuilt files byte-for-byte. The previous malformed-import, immutable
caching, manifest MIME, and security-header defects are resolved.

## How to run and verify

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Results: `npm test` **13/13**, production TypeScript/Vite build passed, and
Playwright **14/14** passed across desktop and 390 px mobile. Independent QA
also exercised matching sidecars, actual EXIF `ImageUniqueID`, timestamp-only
ambiguity, ID and timestamp conflicts, CSV export, invalid-import recovery,
IndexedDB restore, keyboard focus, reduced motion, service-worker update,
cached offline reload, response policies, privacy/outbound requests, and live
deployment identity.

Build budgets pass: 105,910 B raw JS / 37.52 KB gzip, 15,256 B raw CSS / 4.42
KB gzip, and 26,052 B mobile hero image. Live Lighthouse mobile: Performance
99, Accessibility 100, Best Practices 96, SEO 100; LCP 1,504 ms, CLS 0, TBT
120 ms. The Best Practices score reflects a post-audit Chromium crash warning;
direct browser console/page-error monitoring was clean.

## Known limits / next steps

- Metadata availability varies across camera, RAW/video, and editor formats;
  missing evidence correctly stays **ambiguous**. Video text scanning is bounded
  to the first 4 MB and last 8 MB.
- The synthetic 100-group collision corpus passed (90 conflicts, 10 verified),
  but a camera-diverse independently labelled corpus is still needed before
  claiming broad real-world format recall.
- Checkout verification is mocked in the e2e suite; no live purchase was made.
