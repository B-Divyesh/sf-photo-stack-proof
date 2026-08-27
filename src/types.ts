export type Verdict = 'verified' | 'ambiguous' | 'conflict'

export interface EvidenceId {
  kind: string
  value: string
}

export interface FileEvidence {
  name: string
  path: string
  extension: string
  size: number
  mediaType: 'image' | 'video' | 'sidecar' | 'other'
  ids: EvidenceId[]
  capturedAt?: string
  timestampSource?: string
  warnings: string[]
}

export interface ProofGroup {
  id: string
  basename: string
  verdict: Verdict
  reason: string
  confidence: 'strong' | 'review' | 'conflict'
  files: FileEvidence[]
}

export interface AnalysisReport {
  version: 1
  createdAt: string
  fileCount: number
  candidateCount: number
  ignoredSingletons: number
  groups: ProofGroup[]
}
