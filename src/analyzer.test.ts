import { describe, expect, it } from 'vitest'
import { analyzeFiles, basenameOf, classifyGroup, extractTextEvidence } from './analyzer'
import { reportToCsv } from './export'
import type { FileEvidence } from './types'

function evidence(name: string, ids: FileEvidence['ids'] = [], capturedAt?: string): FileEvidence {
  return {
    name,
    path: name,
    extension: name.split('.').pop()!.toLowerCase(),
    size: 100,
    mediaType: name.endsWith('.MOV') ? 'video' : 'image',
    ids,
    capturedAt,
    timestampSource: capturedAt ? 'DateTimeOriginal' : undefined,
    warnings: [],
  }
}

describe('basename grouping', () => {
  it('normalizes case but preserves the actual stem', () => {
    expect(basenameOf('IMG_0421.HEIC')).toBe('img_0421')
    expect(basenameOf('holiday.edit.JPG')).toBe('holiday.edit')
  })
})

describe('conservative classification', () => {
  it('verifies only a shared strong identifier', () => {
    const id = [{ kind: 'ContentIdentifier', value: '7ec5e47d-5a12-4a50-812d-bba5db1b7b11' }]
    const result = classifyGroup('img_1', [evidence('IMG_1.HEIC', id), evidence('IMG_1.MOV', id)])
    expect(result.verdict).toBe('verified')
    expect(result.confidence).toBe('strong')
  })

  it('never treats matching timestamps as verified', () => {
    const result = classifyGroup('img_2', [
      evidence('IMG_2.JPG', [], '2026-08-01T10:00:00.000Z'),
      evidence('IMG_2.MOV', [], '2026-08-01T10:00:02.000Z'),
    ])
    expect(result.verdict).toBe('ambiguous')
  })

  it('marks different values of the same strong identifier as conflict', () => {
    const result = classifyGroup('img_3', [
      evidence('IMG_3.HEIC', [{ kind: 'ContentIdentifier', value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }]),
      evidence('IMG_3.MOV', [{ kind: 'ContentIdentifier', value: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }]),
    ])
    expect(result.verdict).toBe('conflict')
  })

  it('uses far-apart capture times as conflict, never safe', () => {
    const result = classifyGroup('img_4', [
      evidence('IMG_4.JPG', [], '2020-01-01T10:00:00.000Z'),
      evidence('IMG_4.DNG', [], '2025-01-01T10:00:00.000Z'),
    ])
    expect(result.verdict).toBe('conflict')
  })
})

describe('sidecar evidence parsing', () => {
  it('extracts namespaced IDs from XMP attributes', () => {
    const parsed = extractTextEvidence('<rdf:Description apple-fi:ContentIdentifier="9AA60F20-186A-4B5D-AE1C-34DD4B8B11CA"/>')
    expect(parsed.ids).toContainEqual({ kind: 'ContentIdentifier', value: '9aa60f20-186a-4b5d-ae1c-34dd4b8b11ca' })
  })

  it('analyzes same-basename sidecars end to end', async () => {
    const first = new File(['<x:ContentIdentifier>same-proof-id-12345</x:ContentIdentifier>'], 'proof.xmp')
    const second = new File(['{"ContentIdentifier":"same-proof-id-12345"}'], 'proof.json')
    const report = await analyzeFiles([first, second])
    expect(report.candidateCount).toBe(1)
    expect(report.groups[0].verdict).toBe('verified')
  })
})

describe('CSV export', () => {
  it('quotes user-controlled filenames and reasons', () => {
    const group = classifyGroup('a,b', [evidence('a,b.jpg'), evidence('a,b.mov')])
    const csv = reportToCsv({ version: 1, createdAt: new Date(0).toISOString(), fileCount: 2, candidateCount: 1, ignoredSingletons: 0, groups: [group] })
    expect(csv).toContain('"a,b"')
    expect(csv.split('\r\n')).toHaveLength(3)
  })
})
