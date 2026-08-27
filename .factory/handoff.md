# Photo Stack Proof — repair handoff

Work order: `photo-stack-proof-repair-1`
Base QA report: `0fa3ae75f68a45d18c925bbc4a60b38bcc3b753b`
Repaired candidate: `c699a38`
Completed and deployed: 2026-08-27

## What changed

- Added a strict v1 report validator and apply it before every report can be
  persisted or rendered: imported JSON, fresh analysis, current-report restore,
  and named snapshots. It checks the complete nested report/group/file/ID shape,
  ISO dates, safe counters, allowed enums, matching verdict confidence, and
  report count invariants.
- A failed import now leaves the current in-memory and IndexedDB report intact
  and announces recovery. A legacy/corrupt stored current report is removed on
  startup with an explicit safe-recovery message; original files are never
  touched. Invalid snapshots are ignored rather than rendered.
- Added exact regression coverage for the QA payload
  `{"version":1,"createdAt":"not-a-date","groups":[{}]}`. It first creates
  a good report, imports the malformed payload, proves the good report remains,
  reloads, and proves the good report restores.
- Added `public/staticwebapp.config.json`, copied to `dist/` by Vite, for the
  Standard Azure Static Web Apps deployment. Documents and `/sw.js` are
  revalidated (`no-cache, max-age=0, must-revalidate`); `/assets/*` gets
  `public, max-age=31536000, immutable`. It also sets CSP, a restrictive
  Permissions Policy, `X-Frame-Options: DENY`, `nosniff`, referrer policy, and
  `application/manifest+json` for `.webmanifest`. The unhashed product image is
  outside `/assets/`, so the immutable rule applies only to Vite hashed files.
- Bumped the hand-written service-worker cache namespace to `psp-v5`, preserving
  the existing local-only analysis, precache/offline fallback, update toast, and
  PWA behavior. Its offline stylesheet is external so the strict CSP remains
  effective on the fallback page.

## Run and verify

```sh
npm ci
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Results from this repair:

- Clean `npm ci`: passed, 0 vulnerabilities.
- `npm test`: **13/13** passed. This includes complete-shape validation,
  malformed nested evidence, and static-hosting policy assertions.
- `npm run build`: passed; `dist/` contains `index.html` and
  `staticwebapp.config.json`. Initial JS is 105.91 KB raw / 37.52 KB gzip;
  CSS is 15.26 KB raw / 4.42 KB gzip.
- `npm run test:e2e`: **14/14** passed across desktop and 390 px mobile,
  including the exact malformed-import/reload case, local sidecar analysis,
  CSV export, offline reload, accessibility/axe smoke checks, and license flow.
- Live Lighthouse mobile at <https://photo-stack-proof.sociobot.in>: Performance
  **100**, Accessibility **100**, Best Practices **100**, SEO **100**; LCP 1.7 s,
  CLS 0, TBT 0 ms.
- Live header checks confirm the emitted hashed JS has
  `Cache-Control: public, max-age=31536000, immutable`; HTML and manifest have
  no-cache; the manifest is `application/manifest+json`; CSP, Permissions
  Policy, `X-Frame-Options: DENY`, and `nosniff` are present. Live `sw.js`
  reports `psp-v4`.

## Deployment

Deployed as a **Standard Azure Static Web App** with
`/opt/fleet/lib/deploy-static.sh photo-stack-proof /work/repo/dist`.
The custom domain returned HTTP 200 after deployment and the live bundle hash
is `index-DGj4nWYt.js`.

## Known limits / next steps

- Metadata availability still varies by camera, RAW/video format, and editor;
  missing evidence correctly remains ambiguous. The bounded video scan reads
  the first 4 MB and last 8 MB only.
- A real, camera-diverse labelled 100-group corpus is still needed before
  claiming broad format recall. Add format parsers only when that corpus finds
  safe, evidenced false negatives.
- The optional checkout itself remains dependent on the factory’s Sociobot
  product registration; no live purchase was made in this repair.
