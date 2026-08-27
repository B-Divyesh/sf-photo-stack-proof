import type { AnalysisReport } from './types'

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export function reportToCsv(report: AnalysisReport): string {
  const rows = [['group', 'verdict', 'reason', 'file', 'path', 'type', 'size_bytes', 'content_ids', 'captured_at', 'timestamp_source', 'warnings']]
  for (const group of report.groups) {
    for (const file of group.files) {
      rows.push([
        group.basename, group.verdict, group.reason, file.name, file.path, file.mediaType,
        String(file.size), file.ids.map((id) => `${id.kind}:${id.value}`).join(' | '),
        file.capturedAt || '', file.timestampSource || '', file.warnings.join(' | '),
      ])
    }
  }
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export function downloadText(filename: string, text: string, type: string): void {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
