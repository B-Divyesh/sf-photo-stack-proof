import * as exifr from 'exifr'
import type { AnalysisReport, EvidenceId, FileEvidence, ProofGroup } from './types'

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'heic', 'heif', 'tif', 'tiff', 'dng', 'cr2', 'cr3', 'nef', 'arw', 'raf', 'orf', 'rw2', 'png', 'avif', 'webp'])
const VIDEO_EXTENSIONS = new Set(['mov', 'mp4', 'm4v', '3gp'])
const SIDECAR_EXTENSIONS = new Set(['xmp', 'aae', 'json'])
const ID_KEYS = ['ContentIdentifier', 'MediaGroupUUID', 'ImageUniqueID', 'DocumentID', 'InstanceID'] as const
const DATE_KEYS = ['DateTimeOriginal', 'CreateDate', 'MediaCreateDate', 'CreationDate', 'DateCreated'] as const

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > -1 ? name.slice(dot + 1).toLowerCase() : ''
}

export function basenameOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return (dot > 0 ? name.slice(0, dot) : name).normalize('NFC').toLocaleLowerCase()
}

function mediaType(ext: string): FileEvidence['mediaType'] {
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (VIDEO_EXTENSIONS.has(ext)) return 'video'
  if (SIDECAR_EXTENSIONS.has(ext)) return 'sidecar'
  return 'other'
}

function normalizeId(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const result = String(value).trim().replace(/^urn:uuid:/i, '').replace(/[{}]/g, '').toLocaleLowerCase()
  return result.length >= 8 ? result : undefined
}

function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString()
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const raw = String(value).trim().replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function idsFromObject(data: Record<string, unknown>): EvidenceId[] {
  const output: EvidenceId[] = []
  for (const key of ID_KEYS) {
    const value = normalizeId(data[key])
    if (value) output.push({ kind: key, value })
  }
  return output
}

export function extractTextEvidence(text: string): { ids: EvidenceId[]; capturedAt?: string; timestampSource?: string } {
  const ids: EvidenceId[] = []
  for (const key of ID_KEYS) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patterns = [
      new RegExp(`(?:[\\w-]+:)?${escaped}["']?\\s*[=>:]\\s*["']?([^<"'\\s,;]{8,})`, 'ig'),
      new RegExp(`${escaped}[\\s\\S]{0,160}?([0-9a-f]{8}-[0-9a-f-]{20,})`, 'ig'),
    ]
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const value = normalizeId(match[1])
        if (value && !ids.some((id) => id.kind === key && id.value === value)) ids.push({ kind: key, value })
      }
    }
  }
  for (const key of DATE_KEYS) {
    const match = text.match(new RegExp(`(?:[\\w-]+:)?${key}["']?\\s*[=>:]\\s*["']?([^<"']{10,35})`, 'i'))
    const capturedAt = normalizeDate(match?.[1])
    if (capturedAt) return { ids, capturedAt, timestampSource: key }
  }
  return { ids }
}

async function readVideoText(file: File): Promise<string> {
  const chunk = 4 * 1024 * 1024
  if (file.size <= chunk * 2) return new TextDecoder('latin1').decode(await file.arrayBuffer())
  const [head, tail] = await Promise.all([
    file.slice(0, chunk).arrayBuffer(),
    file.slice(Math.max(0, file.size - chunk * 2)).arrayBuffer(),
  ])
  return `${new TextDecoder('latin1').decode(head)}\n${new TextDecoder('latin1').decode(tail)}`
}

async function inspectFile(file: File): Promise<FileEvidence> {
  const extension = extensionOf(file.name)
  const type = mediaType(extension)
  const warnings: string[] = []
  let ids: EvidenceId[] = []
  let capturedAt: string | undefined
  let timestampSource: string | undefined

  try {
    if (type === 'image') {
      const data = await exifr.parse(file, {
        tiff: true, exif: true, gps: false, interop: false,
        xmp: true, iptc: true, icc: false, jfif: false, ihdr: false,
        translateValues: false, reviveValues: true, mergeOutput: true,
      }) as Record<string, unknown> | undefined
      if (data) {
        ids = idsFromObject(data)
        for (const key of DATE_KEYS) {
          const date = normalizeDate(data[key])
          if (date) { capturedAt = date; timestampSource = key; break }
        }
      }
    } else if (type === 'video') {
      const parsed = extractTextEvidence(await readVideoText(file))
      ids = parsed.ids
      capturedAt = parsed.capturedAt
      timestampSource = parsed.timestampSource
    } else if (type === 'sidecar') {
      const text = await file.slice(0, 12 * 1024 * 1024).text()
      const parsed = extractTextEvidence(text)
      ids = parsed.ids
      capturedAt = parsed.capturedAt
      timestampSource = parsed.timestampSource
    }
  } catch (error) {
    warnings.push(`Metadata could not be read: ${error instanceof Error ? error.message : 'unsupported structure'}`)
  }

  if (!ids.length) warnings.push('No supported strong content identifier found')
  if (!capturedAt) warnings.push('No supported capture timestamp found')
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath
  return { name: file.name, path: relative || file.name, extension, size: file.size, mediaType: type, ids, capturedAt, timestampSource, warnings }
}

export function classifyGroup(basename: string, files: FileEvidence[]): ProofGroup {
  const valuesByKind = new Map<string, Map<string, number>>()
  for (const file of files) {
    for (const identifier of file.ids) {
      if (!valuesByKind.has(identifier.kind)) valuesByKind.set(identifier.kind, new Map())
      const values = valuesByKind.get(identifier.kind)!
      values.set(identifier.value, (values.get(identifier.value) || 0) + 1)
    }
  }

  const conflictingKind = [...valuesByKind].find(([, values]) => values.size > 1)
  if (conflictingKind) {
    return makeGroup(basename, files, 'conflict', `Different ${labelId(conflictingKind[0])} values were found. Do not stack this group.`, 'conflict')
  }
  const shared = [...valuesByKind].find(([, values]) => [...values.values()].some((count) => count >= 2))
  if (shared) {
    return makeGroup(basename, files, 'verified', `A matching ${labelId(shared[0])} appears in at least two files.`, 'strong')
  }

  const times = files.flatMap((file) => file.capturedAt ? [new Date(file.capturedAt).getTime()] : [])
  if (times.length >= 2) {
    const spread = Math.max(...times) - Math.min(...times)
    if (spread > 2 * 60 * 60 * 1000) {
      return makeGroup(basename, files, 'conflict', `Capture times differ by ${formatDuration(spread)}. No shared strong identifier overrides the conflict.`, 'conflict')
    }
    if (spread <= 3000) {
      return makeGroup(basename, files, 'ambiguous', 'Capture times align within 3 seconds, but timestamps alone are not proof.', 'review')
    }
    return makeGroup(basename, files, 'ambiguous', `Capture times differ by ${formatDuration(spread)} and no strong identifier is shared.`, 'review')
  }
  return makeGroup(basename, files, 'ambiguous', 'There is not enough comparable embedded evidence to prove this stack.', 'review')
}

function makeGroup(basename: string, files: FileEvidence[], verdict: ProofGroup['verdict'], reason: string, confidence: ProofGroup['confidence']): ProofGroup {
  return { id: `${basename}-${simpleHash(files.map((file) => `${file.path}:${file.size}`).join('|'))}`, basename, verdict, reason, confidence, files }
}

function simpleHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  return (hash >>> 0).toString(36)
}

function labelId(kind: string): string {
  return kind.replace(/([a-z])([A-Z])/g, '$1 $2').toLocaleLowerCase()
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.round(milliseconds / 1000)
  if (seconds < 60) return `${seconds} seconds`
  const minutes = Math.round(seconds / 60)
  if (minutes < 120) return `${minutes} minutes`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} hours`
  return `${Math.round(hours / 24)} days`
}

export async function analyzeFiles(files: File[], onProgress?: (done: number, total: number) => void): Promise<AnalysisReport> {
  const buckets = new Map<string, File[]>()
  for (const file of files) {
    const base = basenameOf(file.name)
    const bucket = buckets.get(base) || []
    bucket.push(file)
    buckets.set(base, bucket)
  }
  const candidates = [...buckets.entries()].filter(([, bucket]) => bucket.length > 1)
  const groups: ProofGroup[] = []
  let done = 0
  for (const [basename, bucket] of candidates) {
    const evidence: FileEvidence[] = []
    for (const file of bucket) {
      evidence.push(await inspectFile(file))
      done += 1
      onProgress?.(done, candidates.reduce((sum, [, item]) => sum + item.length, 0))
    }
    groups.push(classifyGroup(basename, evidence))
  }
  const verdictOrder = { conflict: 0, ambiguous: 1, verified: 2 }
  groups.sort((a, b) => verdictOrder[a.verdict] - verdictOrder[b.verdict] || a.basename.localeCompare(b.basename))
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    fileCount: files.length,
    candidateCount: candidates.length,
    ignoredSingletons: [...buckets.values()].filter((bucket) => bucket.length === 1).length,
    groups,
  }
}
