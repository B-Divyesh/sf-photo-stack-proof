# Photo Stack Proof

Photo Stack Proof is a conservative, local-first preflight for photographers
about to import, stack, or deduplicate years of exports. It groups files by
basename, reads supported embedded content identifiers and capture timestamps,
and labels each candidate group **verified**, **ambiguous**, or **conflict**.

It never uploads, moves, renames, or deletes a file. “Verified” is deliberately
strict: at least two files must share a strong embedded identifier. Matching
timestamps alone are not proof.

Live product: <https://photo-stack-proof.sociobot.in>

## Who it is for

iPhone/Live Photo, RAW, and mixed-library photographers who want a portable
evidence report before trusting a DAM’s filename-based grouping. Supported
metadata varies by camera, app, and format; missing evidence is reported
honestly as ambiguous.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the shown local URL, then choose a folder or several files. Analysis runs
inside the browser. The current report is saved in local IndexedDB and can be
exported as CSV or JSON.

## Test and build

```sh
npm test
npm run build
npm run preview
```

The exact production build command is `npm run build`. Static output lands in
`dist/`, with `dist/index.html` at its root. Deploy `dist/` with SPA fallback to
`index.html`; the included service worker provides offline navigation after the
first successful load.

Optional browser smoke tests are documented in `.factory/handoff.md`.

## Classification rules

- **Verified:** a supported strong identifier of the same kind is present with
  the same value in at least two files, and no identifier of that kind conflicts.
- **Conflict:** comparable strong IDs disagree, or capture times differ by more
  than two hours without shared strong evidence.
- **Ambiguous:** evidence is missing, timestamps only agree, or available
  metadata is not strong enough to prove identity.

CSV export is always free. The optional $19 one-time Proof Archive unlock stores
named report snapshots locally. Purchase and verification use only the Sociobot
billing API; no payment provider is embedded.

## Privacy and limitations

Photos stay on the device. Only a license token is sent to Sociobot for paid
feature verification. See `/privacy` and `/terms` in the app. Always keep a
backup and manually review conflicts before changing a photo library.

## Project notes

- Product brief: [`.factory/brief.json`](.factory/brief.json)
- Visual system and asset provenance: [`.factory/design.md`](.factory/design.md)
- Build/verification handoff: [`.factory/handoff.md`](.factory/handoff.md)

Licensed under the MIT License.
