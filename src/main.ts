import './style.css'
import { analyzeFiles } from './analyzer'
import { downloadText, reportToCsv } from './export'
import { buyUrl, captureReturnedLicense, initialLicenseState, removeLicense, storeLicense, verifyLicense, type LicenseState } from './license'
import { privacyPage, termsPage } from './pages'
import { clearAllData, clearCurrent, deleteSnapshot, loadCurrent, loadSnapshots, saveCurrent, saveSnapshot } from './storage'
import type { AnalysisReport, ProofGroup, Verdict } from './types'

const app = document.querySelector<HTMLDivElement>('#app')!
const currentPath = location.pathname.replace(/\/$/, '') || '/'

if (currentPath === '/privacy' || currentPath === '/terms') {
  app.innerHTML = `${siteHeader(false)}${currentPath === '/privacy' ? privacyPage() : termsPage()}${siteFooter()}`
  registerServiceWorker()
} else {
  captureReturnedLicense()
  renderHome()
}

function siteHeader(withNav = true): string {
  return `<header class="site-header">
    <a class="brand" href="/" aria-label="Photo Stack Proof home">
      <svg aria-hidden="true" viewBox="0 0 48 48"><path d="M8 14h25v21H8zM14 8h26v21H14z"/><path d="M4 24h40"/><circle cx="24" cy="24" r="4"/></svg>
      <span>Photo Stack Proof</span>
    </a>
    ${withNav ? `<nav aria-label="Main navigation"><a href="#how">Method</a><a href="#pricing">Proof Archive</a></nav>` : ''}
    <span class="network-state" id="network-state" role="status">${navigator.onLine ? 'On-device' : 'Offline · on-device'}</span>
  </header>`
}

function siteFooter(): string {
  return `<footer class="site-footer">
    <div><strong>Photo Stack Proof</strong><p>Evidence before automation. Nothing is uploaded.</p></div>
    <nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://github.com/B-Divyesh/sf-photo-stack-proof">Source</a></nav>
    <p class="art-credit">Abstract hero generated for this product · © 2026 Param Factory</p>
  </footer>`
}

function renderHome(): void {
  app.innerHTML = `${siteHeader()}
    <main id="main">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow"><span></span> A local evidence bench</p>
          <h1 id="hero-title">Same name.<br><em>Prove</em> the stack.</h1>
          <p class="hero-lede">Check whether photos, videos, RAWs, and sidecars really belong together—before a DAM stacks them or a cleanup removes the wrong original.</p>
          <a class="button primary" href="#workbench">Choose files to inspect <span aria-hidden="true">↓</span></a>
          <p class="privacy-line"><span aria-hidden="true">◈</span> Metadata stays in this browser. Files are never changed.</p>
        </div>
        <figure class="hero-art">
          <img src="/assets/proof-geometry.webp" alt="Four archival photo plates connected by an evidence thread, with one plate deliberately misaligned" width="1280" height="853" fetchpriority="high" decoding="async">
          <figcaption>One thread can prove a stack. A filename cannot.</figcaption>
        </figure>
      </section>

      <section class="workbench-section" id="workbench" aria-labelledby="workbench-title">
        <div class="section-heading">
          <div><p class="step">01 / Inspect</p><h2 id="workbench-title">Open a folder or file set</h2></div>
          <p>Best for exported folders containing same-basename pairs like <code>IMG_0421.HEIC</code> + <code>IMG_0421.MOV</code>.</p>
        </div>
        <div class="drop-zone" id="drop-zone">
          <div class="stack-mark" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
          <div>
            <h3>Bring the candidate files to the bench</h3>
            <p>Photos, RAWs, videos, XMP, AAE, or JSON sidecars. Read-only.</p>
          </div>
          <div class="picker-actions">
            <button class="button primary" id="choose-folder" type="button">Choose a folder</button>
            <input class="visually-hidden" id="folder-input" type="file" webkitdirectory multiple>
            <button class="button secondary" id="choose-files" type="button">Choose files</button>
            <input class="visually-hidden" id="file-input" type="file" multiple>
            <button class="import-link" id="choose-report" type="button">Import prior JSON report</button>
            <input class="visually-hidden" id="report-input" type="file" accept="application/json,.json">
          </div>
          <p class="drop-note">or drop files here</p>
        </div>
        <div class="analysis-status" id="analysis-status" role="status" aria-live="polite"></div>
      </section>

      <section class="results-section" id="results" aria-labelledby="results-title" hidden>
        <div class="section-heading result-heading">
          <div><p class="step">02 / Review</p><h2 id="results-title">Evidence report</h2></div>
          <p id="report-date"></p>
        </div>
        <div class="stats" id="stats"></div>
        <div class="result-tools">
          <div class="filters" role="group" aria-label="Filter groups">
            <button class="filter active" type="button" data-filter="all" aria-pressed="true">All <span id="count-all">0</span></button>
            <button class="filter" type="button" data-filter="conflict" aria-pressed="false"><i class="status-icon conflict" aria-hidden="true"></i> Conflict <span id="count-conflict">0</span></button>
            <button class="filter" type="button" data-filter="ambiguous" aria-pressed="false"><i class="status-icon ambiguous" aria-hidden="true"></i> Ambiguous <span id="count-ambiguous">0</span></button>
            <button class="filter" type="button" data-filter="verified" aria-pressed="false"><i class="status-icon verified" aria-hidden="true"></i> Verified <span id="count-verified">0</span></button>
          </div>
          <div class="export-actions">
            <button class="button secondary" id="export-json" type="button">Export JSON</button>
            <button class="button primary" id="export-csv" type="button">Export review CSV</button>
          </div>
        </div>
        <p class="rule-note"><strong>Safety rule:</strong> only a shared embedded identifier earns “verified.” A matching timestamp remains ambiguous.</p>
        <div id="group-list" class="group-list"></div>
        <div class="report-footer-actions">
          <button class="text-button" id="new-analysis" type="button">Inspect a different set</button>
          <button class="text-button danger-text" id="clear-report" type="button">Clear this local report</button>
        </div>
      </section>

      <section class="method" id="how" aria-labelledby="method-title">
        <div class="section-heading"><div><p class="step">The proof rule</p><h2 id="method-title">Conservative by design</h2></div><p>A portable preflight, not another automatic stacker.</p></div>
        <ol class="method-grid">
          <li><span>1</span><h3>Group by basename</h3><p>Same-name files become candidates, not assumed matches. Singletons are counted and set aside.</p></li>
          <li><span>2</span><h3>Read local evidence</h3><p>Supported EXIF, XMP, and QuickTime identifiers and capture times are read in your browser.</p></li>
          <li><span>3</span><h3>Require strong agreement</h3><p>A shared content ID can verify. Different IDs or far-apart capture times flag a conflict.</p></li>
        </ol>
        <aside class="limits"><strong>Honest limitation</strong><p>Formats and camera apps expose different metadata. Missing evidence means “ambiguous”—never a guess. Always keep a backup before changing a library.</p></aside>
      </section>

      <section class="pricing" id="pricing" aria-labelledby="pricing-title">
        <div class="pricing-copy"><p class="step">One careful upgrade</p><h2 id="pricing-title">Keep a migration paper trail.</h2><p>The analyzer and CSV/JSON exports are free. Proof Archive adds named, on-device snapshots so you can compare preflights across a long migration.</p></div>
        <div class="price-card">
          <div><span class="price">$19</span><span>one time</span></div>
          <ul><li>Unlimited named audit snapshots</li><li>Stored only on this device</li><li>Restore on another device with your license</li></ul>
          <a class="button primary buy-link" href="${buyUrl}">Buy Proof Archive</a>
          <button class="text-button" type="button" id="restore-toggle">Have a license? Restore it</button>
          <form id="license-form" class="license-form" hidden>
            <label for="license-token">License token</label>
            <div><input id="license-token" name="license" autocomplete="off" required><button class="button secondary" type="submit">Verify license</button></div>
          </form>
          <p id="license-status" class="license-status" role="status" aria-live="polite"></p>
        </div>
        <div class="archive" id="archive" hidden>
          <div class="archive-head"><h3>Proof Archive</h3><button class="button secondary" type="button" id="save-snapshot">Save current report</button></div>
          <div id="snapshot-list"></div>
        </div>
      </section>
    </main>
    <div class="toast" id="update-toast" role="status" hidden>Update available. <button type="button">Reload</button></div>
    ${siteFooter()}`

  bindHome()
}

let report: AnalysisReport | undefined
let activeFilter: Verdict | 'all' = 'all'
let licenseState: LicenseState = initialLicenseState()

function bindHome(): void {
  const dropZone = byId('drop-zone')
  const folderInput = byId<HTMLInputElement>('folder-input')
  const fileInput = byId<HTMLInputElement>('file-input')
  const reportInput = byId<HTMLInputElement>('report-input')
  byId('choose-folder').addEventListener('click', () => folderInput.click())
  byId('choose-files').addEventListener('click', () => fileInput.click())
  byId('choose-report').addEventListener('click', () => reportInput.click())
  folderInput.addEventListener('change', () => startAnalysis([...folderInput.files || []]))
  fileInput.addEventListener('change', () => startAnalysis([...fileInput.files || []]))
  reportInput.addEventListener('change', () => importReport(reportInput.files?.[0]))
  ;['dragenter', 'dragover'].forEach((name) => dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add('dragging') }))
  ;['dragleave', 'drop'].forEach((name) => dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove('dragging') }))
  dropZone.addEventListener('drop', (event) => {
    const files = [...(event as DragEvent).dataTransfer?.files || []]
    if (files.length) startAnalysis(files)
  })
  document.querySelectorAll<HTMLButtonElement>('.filter').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter as Verdict | 'all')))
  byId('export-csv').addEventListener('click', exportCsv)
  byId('export-json').addEventListener('click', exportJson)
  byId('new-analysis').addEventListener('click', resetPicker)
  byId('clear-report').addEventListener('click', clearReport)
  byId('restore-toggle').addEventListener('click', () => {
    const form = byId<HTMLFormElement>('license-form')
    form.hidden = !form.hidden
    if (!form.hidden) byId<HTMLInputElement>('license-token').focus()
  })
  byId<HTMLFormElement>('license-form').addEventListener('submit', restoreLicense)
  byId('save-snapshot').addEventListener('click', saveCurrentSnapshot)
  window.addEventListener('online', updateNetworkState)
  window.addEventListener('offline', updateNetworkState)
  restoreCurrentReport()
  refreshLicense()
  registerServiceWorker()
}

async function startAnalysis(files: File[]): Promise<void> {
  const status = byId('analysis-status')
  if (!files.length) { status.textContent = 'No files were selected. Choose a folder or at least two same-name files.'; return }
  status.innerHTML = `<span class="spinner" aria-hidden="true"></span><strong>Reading evidence…</strong> <span id="progress-text">Preparing ${files.length.toLocaleString()} files</span>`
  byId('drop-zone').classList.add('working')
  try {
    report = await analyzeFiles(files, (done, total) => {
      const progress = document.querySelector('#progress-text')
      if (progress) progress.textContent = `${done.toLocaleString()} of ${total.toLocaleString()} candidate files`
    })
    await saveCurrent(report)
    if (!report.groups.length) {
      status.innerHTML = `<strong>No candidate stacks found.</strong> ${report.ignoredSingletons.toLocaleString()} unique basename${report.ignoredSingletons === 1 ? '' : 's'} found. Choose a set with at least two files sharing a name before the extension.`
      byId('results').hidden = true
    } else {
      status.textContent = `Inspection complete: ${report.candidateCount} candidate group${report.candidateCount === 1 ? '' : 's'} found.`
      renderReport(report)
      byId('results').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    }
  } catch (error) {
    status.innerHTML = `<strong>That set could not be inspected.</strong> ${escapeHtml(error instanceof Error ? error.message : 'Try choosing the files again.')}`
  } finally {
    byId('drop-zone').classList.remove('working')
  }
}

function renderReport(value: AnalysisReport): void {
  report = value
  byId('results').hidden = false
  byId('report-date').textContent = `Created ${new Date(value.createdAt).toLocaleString()}`
  const counts = countVerdicts(value)
  byId('stats').innerHTML = `
    <div><span>${value.candidateCount}</span><small>candidate groups</small></div>
    <div class="danger-stat"><span>${counts.conflict}</span><small>conflicts</small></div>
    <div class="warning-stat"><span>${counts.ambiguous}</span><small>need review</small></div>
    <div class="success-stat"><span>${counts.verified}</span><small>verified</small></div>`
  ;(['all', 'conflict', 'ambiguous', 'verified'] as const).forEach((key) => { byId(`count-${key}`).textContent = String(key === 'all' ? value.groups.length : counts[key]) })
  renderGroups()
}

function renderGroups(): void {
  const list = byId('group-list')
  list.replaceChildren()
  if (!report) return
  const visible = report.groups.filter((group) => activeFilter === 'all' || group.verdict === activeFilter)
  if (!visible.length) {
    const empty = document.createElement('p')
    empty.className = 'empty-filter'
    empty.textContent = `No ${activeFilter} groups in this report.`
    list.append(empty)
    return
  }
  visible.forEach((group, index) => list.append(createGroup(group, index)))
}

function createGroup(group: ProofGroup, index: number): HTMLElement {
  const details = document.createElement('details')
  details.className = `proof-group ${group.verdict}`
  if (index === 0 && group.verdict === 'conflict') details.open = true
  const summary = document.createElement('summary')
  summary.innerHTML = `<span class="status-icon ${group.verdict}" aria-hidden="true"></span><span class="group-name"></span><span class="file-count">${group.files.length} files</span><span class="verdict-label">${capitalize(group.verdict)}</span><span class="chevron" aria-hidden="true">⌄</span>`
  summary.querySelector<HTMLElement>('.group-name')!.textContent = group.basename
  details.append(summary)
  const body = document.createElement('div')
  body.className = 'group-body'
  const reason = document.createElement('p')
  reason.className = 'reason'
  reason.textContent = group.reason
  body.append(reason)
  const files = document.createElement('div')
  files.className = 'evidence-files'
  for (const file of group.files) {
    const item = document.createElement('article')
    item.className = 'evidence-file'
    const title = document.createElement('h4')
    title.textContent = file.name
    const path = document.createElement('p')
    path.className = 'file-path'
    path.textContent = file.path
    const dl = document.createElement('dl')
    addDefinition(dl, 'Kind', `${file.mediaType} · ${formatBytes(file.size)}`)
    addDefinition(dl, 'Strong ID', file.ids.length ? file.ids.map((id) => `${id.kind}: ${shortId(id.value)}`).join('\n') : 'Not found')
    addDefinition(dl, 'Captured', file.capturedAt ? `${formatDate(file.capturedAt)} (${file.timestampSource})` : 'Not found')
    item.append(title, path, dl)
    files.append(item)
  }
  body.append(files)
  details.append(body)
  return details
}

function addDefinition(list: HTMLDListElement, term: string, description: string): void {
  const dt = document.createElement('dt'); dt.textContent = term
  const dd = document.createElement('dd'); dd.textContent = description
  list.append(dt, dd)
}

function setFilter(filter: Verdict | 'all'): void {
  activeFilter = filter
  document.querySelectorAll<HTMLButtonElement>('.filter').forEach((button) => {
    const selected = button.dataset.filter === filter
    button.classList.toggle('active', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
  renderGroups()
}

function exportCsv(): void {
  if (!report) return
  downloadText(filename('csv'), reportToCsv(report), 'text/csv;charset=utf-8')
}

function exportJson(): void {
  if (!report) return
  downloadText(filename('json'), JSON.stringify(report, null, 2), 'application/json')
}

async function importReport(file?: File): Promise<void> {
  if (!file) return
  const status = byId('analysis-status')
  try {
    const candidate = JSON.parse(await file.text()) as Partial<AnalysisReport>
    if (candidate.version !== 1 || !Array.isArray(candidate.groups) || typeof candidate.createdAt !== 'string') throw new Error('This is not a Photo Stack Proof v1 report.')
    report = candidate as AnalysisReport
    await saveCurrent(report)
    renderReport(report)
    status.textContent = `Imported ${file.name}. This displays saved evidence; choose the originals to re-read metadata.`
    byId('results').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  } catch (error) {
    status.innerHTML = `<strong>Report import failed.</strong> ${escapeHtml(error instanceof Error ? error.message : 'Choose a JSON report exported by Photo Stack Proof.')}`
  }
}

function filename(extension: string): string {
  return `photo-stack-proof-${new Date().toISOString().slice(0, 10)}.${extension}`
}

async function restoreCurrentReport(): Promise<void> {
  try {
    const stored = await loadCurrent()
    if (stored?.version === 1 && stored.groups.length) {
      report = stored
      renderReport(stored)
      byId('analysis-status').textContent = 'Restored your latest local report. Choose files again to re-read the originals.'
    }
  } catch { /* Private browsing may disable IndexedDB; analysis still works. */ }
}

function resetPicker(): void {
  byId<HTMLInputElement>('file-input').value = ''
  byId<HTMLInputElement>('folder-input').value = ''
  byId<HTMLInputElement>('report-input').value = ''
  byId('workbench').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  byId<HTMLButtonElement>('choose-folder').focus()
}

async function clearReport(): Promise<void> {
  if (!confirm('Clear this report from this browser? Your original files will not be touched.')) return
  report = undefined
  await clearCurrent().catch(() => undefined)
  byId('results').hidden = true
  byId('analysis-status').textContent = 'Local report cleared. Your original files were not changed.'
  byId('workbench').scrollIntoView({ behavior: 'auto' })
}

async function refreshLicense(): Promise<void> {
  paintLicense()
  if (licenseState.token && licenseState.checking) {
    licenseState = await verifyLicense()
    paintLicense()
  }
}

function paintLicense(): void {
  const status = byId('license-status')
  const archive = byId('archive')
  archive.hidden = !licenseState.unlocked
  if (licenseState.checking) status.textContent = 'Checking your saved license…'
  else if (licenseState.unlocked) status.innerHTML = `Proof Archive is unlocked. <button class="inline-button" id="remove-license" type="button">Remove license</button>`
  else if (licenseState.reason && licenseState.reason !== 'offline') status.textContent = 'License no longer active. The free analyzer and exports still work.'
  else if (licenseState.reason === 'offline') status.textContent = 'Could not verify while offline. Reconnect to unlock this device.'
  else status.textContent = 'Free analyzer · no account required.'
  document.querySelector('#remove-license')?.addEventListener('click', () => { removeLicense(); licenseState = initialLicenseState(); paintLicense() })
  if (licenseState.unlocked) renderSnapshots()
}

async function restoreLicense(event: SubmitEvent): Promise<void> {
  event.preventDefault()
  const input = byId<HTMLInputElement>('license-token')
  const token = input.value.trim()
  if (!token) return
  storeLicense(token)
  licenseState = { token, unlocked: false, checking: true }
  paintLicense()
  licenseState = await verifyLicense(true)
  paintLicense()
  if (licenseState.unlocked) { input.value = ''; byId<HTMLFormElement>('license-form').hidden = true }
}

async function saveCurrentSnapshot(): Promise<void> {
  if (!report || !licenseState.unlocked) return
  const defaultName = `Migration audit · ${new Date().toLocaleDateString()}`
  const name = prompt('Name this audit snapshot', defaultName)?.trim()
  if (!name) return
  await saveSnapshot(name, report)
  await renderSnapshots()
}

async function renderSnapshots(): Promise<void> {
  const list = byId('snapshot-list')
  const snapshots = await loadSnapshots().catch(() => [])
  list.replaceChildren()
  if (!snapshots.length) { list.innerHTML = '<p class="archive-empty">No saved audits yet. Run an inspection, then save its snapshot here.</p>'; return }
  for (const snapshot of snapshots) {
    const row = document.createElement('div')
    row.className = 'snapshot-row'
    const info = document.createElement('div')
    const title = document.createElement('strong'); title.textContent = snapshot.name
    const meta = document.createElement('span'); meta.textContent = `${snapshot.report.candidateCount} groups · ${new Date(snapshot.savedAt).toLocaleString()}`
    info.append(title, meta)
    const open = document.createElement('button'); open.className = 'text-button'; open.type = 'button'; open.textContent = 'Open'
    open.addEventListener('click', () => { report = snapshot.report; renderReport(snapshot.report); byId('results').scrollIntoView() })
    const remove = document.createElement('button'); remove.className = 'text-button danger-text'; remove.type = 'button'; remove.textContent = 'Delete'
    remove.addEventListener('click', async () => { await deleteSnapshot(snapshot.id); await renderSnapshots() })
    row.append(info, open, remove)
    list.append(row)
  }
}

function updateNetworkState(): void {
  const node = document.querySelector('#network-state')
  if (node) node.textContent = navigator.onLine ? 'On-device' : 'Offline · on-device'
}

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          const toast = document.querySelector<HTMLElement>('#update-toast')
          if (toast) { toast.hidden = false; toast.querySelector('button')?.addEventListener('click', () => location.reload()) }
        }
      })
    })
  }).catch(() => undefined)
}

function countVerdicts(value: AnalysisReport): Record<Verdict, number> {
  return value.groups.reduce((counts, group) => { counts[group.verdict] += 1; return counts }, { verified: 0, ambiguous: 0, conflict: 0 })
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T { return document.getElementById(id) as T }
function capitalize(value: string): string { return `${value.charAt(0).toUpperCase()}${value.slice(1)}` }
function formatDate(value: string): string { return new Date(value).toLocaleString() }
function formatBytes(bytes: number): string { if (bytes < 1024) return `${bytes} B`; if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1048576).toFixed(1)} MB` }
function shortId(value: string): string { return value.length > 28 ? `${value.slice(0, 13)}…${value.slice(-10)}` : value }
function escapeHtml(value: string): string { const div = document.createElement('div'); div.textContent = value; return div.innerHTML }
function prefersReducedMotion(): boolean { return matchMedia('(prefers-reduced-motion: reduce)').matches }

// Exposed only for the privacy page's browser-data affordance in future versions.
void clearAllData
