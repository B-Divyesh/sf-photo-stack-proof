# Photo Stack Proof — repair 2 handoff

- Work order: `photo-stack-proof-repair-2`
- Implementation SHA: `35fb5b8f6dbe5c4f2fe2ef2ce01c00f3e9689c7c`
- Documentation SHA: recorded in the follow-up handoff commit
- Live URL: <https://photo-stack-proof.sociobot.in>
- Prepared: 2026-09-06 UTC

## What changed

- Added `/demo` with a one-click realistic report: one verified group, one
  conflict, and one ambiguous group. Demo data uses the separate
  `photo-stack-proof-demo` IndexedDB database. It never reads or writes the
  normal report database or license storage. Reset restores the sample; Start
  for real deletes the demo database before opening the normal app.
- Added a persistent demo label and a browser regression that proves clearing,
  resetting, and leaving demo mode do not alter a real report.
- Added a claim registry, demo documentation, landing-copy audit, and nine
  outcome-based sandbox checks. Each claim command builds from the documented
  setup and runs in desktop and phone browser projects.
- Replaced mood copy with a plain job headline, named the photographer
  audience, added the sample action and three privacy/offline/price facts, and
  updated the catalog description.
- Added per-route titles and dynamic canonical/social metadata, an Apple touch
  icon, Open Graph image, sitemap demo entry, footer build ID, known-route
  rewrites, and a styled static 404 response.
- Raised header and footer links to 44 px touch targets and show parser read
  errors in each visible evidence record.
- Added a labelled camera corpus based on independently maintained ExifTool
  test vectors: iPhone JPEG, Canon CR2/DNG, Panasonic RW2, and QuickTime MOV.
  It drives 100 candidate groups in a real browser: 90 conflicts and 10
  verified groups. The MOV fixture’s unsupported evidence stays missing and is
  never used as proof.
- Pinned Playwright to the preinstalled `1.58.2` and made the browser test
  command start a fresh preview server.

## Verification

From the documented setup:

```sh
npm ci
npm test                         # 14/14 passed
npm run build                    # dist/ produced
npm run test:e2e                 # 34/34 passed: desktop and 390 px phone
```

Every command in `.factory/claims.json` was run and passed. They cover local
metadata analysis, three verdicts, unchanged source files, same-origin demo
privacy, CSV/JSON exports, report persistence, offline reload in a dedicated
browser context, valid-license snapshots, and the 100-group camera corpus.

Accessibility checks use axe in Playwright on home, demo, privacy, terms, and
the static 404 page; no serious or critical violations were found. Keyboard
skip navigation, visible focus, reduced motion, touch targets, mobile width,
offline reload, invalid imports, corrupt-media recovery, and route titles are
also covered by browser checks.

Local fresh desktop and phone inspection showed:

- Job: **Verify photo stacks before importing**.
- Audience: photographers checking iPhone, RAW, and export folders before a
  DAM groups same-name files.
- First action: **Try it with sample data**.

Local Lighthouse reported Performance 100, Accessibility 100, Best Practices
100, and SEO 100; LCP was 1.7 s and CLS 0. Lighthouse printed its known
post-audit Chromium-tab-crash warning after writing the complete report. Direct
browser console monitoring was clean.

## Earlier findings

| Finding | Current disposition |
| --- | --- |
| Demo used real report storage | Fixed with a separate demo database and leave-demo regression test. |
| Claim registry and tagged sandbox tests missing | Fixed with nine declarations and individually runnable commands. |
| Plain-language first screen and copy audit missing | Fixed. |
| Unknown routes returned the home app | Fixed in Static Web Apps configuration with `/404.html`; the development SPA also renders a styled not-found state. |
| Route metadata, sharing metadata, sitemap demo entry, build ID missing | Fixed. |
| Controls below 44 px | Fixed for header/footer links and wordmark. |
| Corrupt-media errors hidden | Fixed with visible `Read notes` evidence. |
| Camera-diverse corpus missing | Fixed with the labelled 100-group browser corpus. |
| Old malformed-import, cache, MIME, CSP, and response-policy defects | Remain covered and passing. |

## Known gap: billing registration

The paid $19 Proof Archive remains in the product, Terms, and license restore
flow. Its client checkout and validation URLs use the required Sociobot billing
API. On 2026-09-06, the live checkout endpoint for this product returned HTTP
404, including when checked with the factory-prefixed slug. A static PWA cannot
register a product or repair that external billing record without the separate
billing-registration operator. The required offer metadata is written to
`/work/.evidence/billing-offer.json`; it records the actual price, return URL,
paid features, verification path, and the unavailable-registration evidence.
The free analyzer and exports remain fully functional.

## Next steps

1. The billing-registration operator must register/enable the existing
   `photo-stack-proof` one-time $19 offer and confirm checkout returns a hosted
   page before this paid path can be called complete.
2. After deployment, perform the HTTPS cold desktop and phone checks recorded
   below this handoff and keep the implementation/documentation SHA distinction.
