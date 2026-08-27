const SLUG = 'photo-stack-proof'
const API_BASE = 'https://api.sociobot.in/api/v1'
const TOKEN_KEY = `sb_license:${SLUG}`
const VERDICT_KEY = `${TOKEN_KEY}:verdict`
const DAY = 24 * 60 * 60 * 1000

interface CachedVerdict {
  checkedAt: number
  valid: boolean
  reason?: string
}

export interface LicenseState {
  token?: string
  unlocked: boolean
  checking: boolean
  reason?: string
}

export const buyUrl = `${API_BASE}/products/${SLUG}/checkout`

function storedVerdict(): CachedVerdict | undefined {
  try { return JSON.parse(localStorage.getItem(VERDICT_KEY) || '') as CachedVerdict } catch { return undefined }
}

export function captureReturnedLicense(): void {
  const url = new URL(location.href)
  const token = url.searchParams.get('license')
  if (!token) return
  localStorage.setItem(TOKEN_KEY, token.trim())
  localStorage.removeItem(VERDICT_KEY)
  url.searchParams.delete('license')
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

export function initialLicenseState(): LicenseState {
  const token = localStorage.getItem(TOKEN_KEY)?.trim()
  const cached = storedVerdict()
  return {
    token: token || undefined,
    unlocked: Boolean(token && cached?.valid),
    checking: Boolean(token && (!cached || Date.now() - cached.checkedAt > DAY)),
    reason: cached?.reason,
  }
}

export async function verifyLicense(force = false): Promise<LicenseState> {
  const token = localStorage.getItem(TOKEN_KEY)?.trim()
  if (!token) return { unlocked: false, checking: false }
  const cached = storedVerdict()
  if (!force && cached && Date.now() - cached.checkedAt < DAY) {
    return { token, unlocked: cached.valid, checking: false, reason: cached.reason }
  }
  try {
    const response = await fetch(`${API_BASE}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`)
    if (!response.ok) throw new Error(`Verification returned ${response.status}`)
    const result = await response.json() as { valid: boolean; reason?: string }
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ checkedAt: Date.now(), valid: result.valid, reason: result.reason }))
    return { token, unlocked: result.valid, checking: false, reason: result.reason }
  } catch {
    return { token, unlocked: Boolean(cached?.valid), checking: false, reason: cached ? cached.reason : 'offline' }
  }
}

export function storeLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim())
  localStorage.removeItem(VERDICT_KEY)
}

export function removeLicense(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(VERDICT_KEY)
}
