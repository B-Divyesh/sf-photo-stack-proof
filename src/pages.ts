export function privacyPage(): string {
  return `
    <main id="main" class="legal-shell">
      <a class="back-link" href="/">← Back to Photo Stack Proof</a>
      <h1>Privacy, in plain language</h1>
      <p class="legal-lede">Your photos and their metadata stay on your device. Photo Stack Proof has no upload server and no analytics.</p>
      <h2>What the app reads</h2>
      <p>When you choose files, the browser grants this tab temporary read access. The app reads filenames, file sizes, supported embedded content identifiers, and capture timestamps only to create the report you see.</p>
      <h2>What the app stores</h2>
      <p>The latest report is stored in IndexedDB on this device so a refresh does not erase your work. It contains filenames and extracted evidence, not the photos themselves. If you save Pro audit snapshots, those are stored in the same local database. A license token and its cached verification result are stored in localStorage.</p>
      <h2>What leaves the device</h2>
      <p>Only a license token is sent to Sociobot when you verify a purchase. The files, report, filenames, and metadata are never sent. Checkout is hosted by Sociobot; Dodo is the merchant of record and processes payment information under its own privacy terms.</p>
      <h2>Your controls</h2>
      <p>You can export your report, clear local report data from the workbench, or remove site data in your browser. Questions: <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>
      <p class="legal-date">Effective 27 August 2026.</p>
    </main>`
}

export function termsPage(): string {
  return `
    <main id="main" class="legal-shell">
      <a class="back-link" href="/">← Back to Photo Stack Proof</a>
      <h1>Terms of use</h1>
      <p class="legal-lede">Photo Stack Proof is a preflight aid. It does not replace backups or your own review before changing a library.</p>
      <h2>What the tool does</h2>
      <p>The app groups same-basename files and labels available metadata evidence. “Verified” means at least two files share a supported strong identifier. “Ambiguous” and “conflict” require review. Format support and source metadata vary, so no report can guarantee file identity.</p>
      <h2>Your responsibility</h2>
      <p>The app never deletes, moves, or renames files. Keep independent backups and inspect conflict or ambiguous groups before using a DAM, deduplicator, or deletion tool. You are responsible for decisions made from a report.</p>
      <h2>Purchase and license</h2>
      <p>Proof Archive is a $19 one-time purchase for the included features. Sociobot/Dodo is the merchant of record. Checkout, receipts, refunds, taxes, and payment disputes are handled there. A refunded or revoked purchase stops unlocking paid features. The free analyzer and exports remain available.</p>
      <h2>Availability and warranty</h2>
      <p>The software is provided “as is” without warranties to the extent permitted by law. We may improve supported formats and evidence rules, while keeping classifications conservative.</p>
      <p>Questions: <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>
      <p class="legal-date">Effective 27 August 2026.</p>
    </main>`
}
