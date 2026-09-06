# Photo Stack Proof — review 1 handoff

## FAIL — nine findings remain

- Work order: `photo-stack-proof-review-1`
- Implementation reviewed: `8a781f013a8c0667fb81feff3c07e034a7c9ac89`
- Documentation SHA reviewed: `dd83e254ff4a924cb5248c5735816ab0652f5c3c`
- Live URL: <https://photo-stack-proof.sociobot.in>
- Full report: [`.factory/review-1.md`](review-1.md)
- Reviewed: 2026-09-06 UTC

No product code was changed. The review found 2 P1, 4 P2, and 3 P3 findings,
plus 8 public claim families without the required claim declarations and tagged
tests. The release blockers are the missing/unsafe demo and the live $19
checkout returning HTTP 404.

## Verification performed

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The clean checkout passed 13/13 unit tests, built `dist/`, and passed 14/14
Playwright tests after installing the documented Chromium prerequisite. Live
desktop and phone checks covered normal, invalid, boundary, persistence,
clear/reset, keyboard, focus, reduced motion, axe, privacy traffic, offline
reload, links, legal routes, and unknown routes. Lighthouse mobile scored
100/100/100/100 with LCP 1.62 s, TBT 32 ms, and CLS 0.

The live HTML, CSS, JavaScript, and service worker are byte-identical to the
rebuilt candidate. Prior malformed-import, caching, manifest MIME, and security
header findings are resolved. The prior real camera-format corpus limit remains
open.

## Required next work

1. Add the isolated one-click demo, its persistent controls, and
   `.factory/demo.md`; ensure `/demo` never reads or writes the normal namespace.
2. Register/fix the Sociobot billing product so the live checkout succeeds.
3. Add `.factory/claims.json` and one tagged sandbox test for every public
   claim; add `.factory/copy-audit.md` and remove metaphor copy.
4. Add a real 404, per-route titles, canonical/social metadata, compliant touch
   targets, footer build identity, and visible parser-error guidance.
5. Validate supported formats against an independently labelled camera-diverse
   corpus before making broad format claims.
