import type { AnalysisReport, EvidenceId, FileEvidence, ProofGroup, Verdict } from './types'

const REPORT_KEYS = ['version', 'createdAt', 'fileCount', 'candidateCount', 'ignoredSingletons', 'groups']
const GROUP_KEYS = ['id', 'basename', 'verdict', 'reason', 'confidence', 'files']
const FILE_KEYS = ['name', 'path', 'extension', 'size', 'mediaType', 'ids', 'capturedAt', 'timestampSource', 'warnings']
const ID_KEYS = ['kind', 'value']
const verdicts = new Set<Verdict>(['verified', 'ambiguous', 'conflict'])
const mediaTypes = new Set<FileEvidence['mediaType']>(['image', 'video', 'sidecar', 'other'])

export class ReportValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReportValidationError'
  }
}

/**
 * Treat reports as untrusted at every browser-data boundary. This deliberately
 * accepts only the v1 shape we export, so a partly compatible object can never
 * reach the renderer or IndexedDB.
 */
export function validateReport(value: unknown): AnalysisReport {
  const report = objectAt(value, 'report', REPORT_KEYS)
  if (report.version !== 1) fail('report.version must be 1')
  isoDate(report.createdAt, 'report.createdAt')
  const fileCount = nonNegativeInteger(report.fileCount, 'report.fileCount')
  const candidateCount = nonNegativeInteger(report.candidateCount, 'report.candidateCount')
  const ignoredSingletons = nonNegativeInteger(report.ignoredSingletons, 'report.ignoredSingletons')
  if (!Array.isArray(report.groups)) fail('report.groups must be an array')
  const groups = report.groups.map((group, index) => validateGroup(group, `report.groups[${index}]`))

  if (candidateCount !== groups.length) fail('report.candidateCount must equal the number of groups')
  const candidateFiles = groups.reduce((total, group) => total + group.files.length, 0)
  if (fileCount !== candidateFiles + ignoredSingletons) {
    fail('report.fileCount must equal candidate files plus ignored singletons')
  }

  return { version: 1, createdAt: report.createdAt as string, fileCount, candidateCount, ignoredSingletons, groups }
}

function validateGroup(value: unknown, path: string): ProofGroup {
  const group = objectAt(value, path, GROUP_KEYS)
  const id = text(group.id, `${path}.id`)
  const basename = text(group.basename, `${path}.basename`)
  const verdict = enumValue(group.verdict, verdicts, `${path}.verdict`)
  const reason = text(group.reason, `${path}.reason`)
  const confidence = enumValue(group.confidence, new Set<ProofGroup['confidence']>(['strong', 'review', 'conflict']), `${path}.confidence`)
  if (!Array.isArray(group.files) || group.files.length < 2) fail(`${path}.files must contain at least two files`)
  if ((verdict === 'verified' && confidence !== 'strong') || (verdict === 'ambiguous' && confidence !== 'review') || (verdict === 'conflict' && confidence !== 'conflict')) {
    fail(`${path}.confidence does not match its verdict`)
  }
  return { id, basename, verdict, reason, confidence, files: group.files.map((file, index) => validateFile(file, `${path}.files[${index}]`)) }
}

function validateFile(value: unknown, path: string): FileEvidence {
  const file = objectAt(value, path, FILE_KEYS, ['capturedAt', 'timestampSource'])
  const name = text(file.name, `${path}.name`)
  const filePath = text(file.path, `${path}.path`)
  const extension = text(file.extension, `${path}.extension`, true)
  const size = nonNegativeInteger(file.size, `${path}.size`)
  const type = enumValue(file.mediaType, mediaTypes, `${path}.mediaType`)
  if (!Array.isArray(file.ids)) fail(`${path}.ids must be an array`)
  const ids = file.ids.map((id, index) => validateId(id, `${path}.ids[${index}]`))
  if (new Set(ids.map((id) => `${id.kind}\u0000${id.value}`)).size !== ids.length) fail(`${path}.ids must not contain duplicates`)
  if (!Array.isArray(file.warnings) || !file.warnings.every((warning) => typeof warning === 'string')) fail(`${path}.warnings must be an array of strings`)
  const capturedAt = optionalDate(file.capturedAt, `${path}.capturedAt`)
  const timestampSource = optionalText(file.timestampSource, `${path}.timestampSource`)
  if (Boolean(capturedAt) !== Boolean(timestampSource)) fail(`${path}.capturedAt and timestampSource must appear together`)
  return { name, path: filePath, extension, size, mediaType: type, ids, capturedAt, timestampSource, warnings: [...file.warnings] }
}

function validateId(value: unknown, path: string): EvidenceId {
  const id = objectAt(value, path, ID_KEYS)
  return { kind: text(id.kind, `${path}.kind`), value: text(id.value, `${path}.value`) }
}

function objectAt(value: unknown, path: string, required: string[], optional: string[] = []): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${path} must be an object`)
  const object = value as Record<string, unknown>
  const allowed = new Set([...required, ...optional])
  for (const key of required) if (!(key in object)) fail(`${path}.${key} is required`)
  for (const key of Object.keys(object)) if (!allowed.has(key)) fail(`${path}.${key} is not supported by report v1`)
  return object
}

function text(value: unknown, path: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) fail(`${path} must be a ${allowEmpty ? '' : 'non-empty '}string`)
  return value
}

function optionalText(value: unknown, path: string): string | undefined {
  if (value === undefined) return undefined
  return text(value, path)
}

function isoDate(value: unknown, path: string): string {
  const date = text(value, path)
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== date) fail(`${path} must be a valid ISO timestamp`)
  return date
}

function optionalDate(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : isoDate(value, path)
}

function nonNegativeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) fail(`${path} must be a non-negative integer`)
  return value
}

function enumValue<T extends string>(value: unknown, choices: Set<T>, path: string): T {
  if (typeof value !== 'string' || !choices.has(value as T)) fail(`${path} is not a supported value`)
  return value as T
}

function fail(message: string): never { throw new ReportValidationError(message) }
