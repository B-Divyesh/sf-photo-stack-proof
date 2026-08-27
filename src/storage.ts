import type { AnalysisReport } from './types'
import { validateReport } from './report-validation'

const DB_NAME = 'photo-stack-proof'
const DB_VERSION = 1
const CURRENT_KEY = 'current'

interface Snapshot {
  id: string
  name: string
  savedAt: string
  report: AnalysisReport
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('reports')) db.createObjectStore('reports')
      if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transact<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const request = action(transaction.objectStore(storeName))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  })
}

export function saveCurrent(report: AnalysisReport): Promise<IDBValidKey> {
  return transact('reports', 'readwrite', (store) => store.put(validateReport(report), CURRENT_KEY))
}

export async function loadCurrent(): Promise<AnalysisReport | undefined> {
  const stored = await transact('reports', 'readonly', (store) => store.get(CURRENT_KEY)) as unknown
  return stored === undefined ? undefined : validateReport(stored)
}

export function clearCurrent(): Promise<undefined> {
  return transact('reports', 'readwrite', (store) => store.delete(CURRENT_KEY))
}

export function saveSnapshot(name: string, report: AnalysisReport): Promise<IDBValidKey> {
  const item: Snapshot = { id: crypto.randomUUID(), name, savedAt: new Date().toISOString(), report: validateReport(report) }
  return transact('snapshots', 'readwrite', (store) => store.put(item))
}

export async function loadSnapshots(): Promise<Snapshot[]> {
  const snapshots = await transact('snapshots', 'readonly', (store) => store.getAll()) as Array<Partial<Snapshot>>
  return snapshots.flatMap((snapshot) => {
    try {
      if (typeof snapshot.id !== 'string' || typeof snapshot.name !== 'string' || typeof snapshot.savedAt !== 'string') return []
      return [{ id: snapshot.id, name: snapshot.name, savedAt: snapshot.savedAt, report: validateReport(snapshot.report) }]
    } catch { return [] }
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export function deleteSnapshot(id: string): Promise<undefined> {
  return transact('snapshots', 'readwrite', (store) => store.delete(id))
}

export function clearAllData(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Close other Photo Stack Proof tabs and try again.'))
  })
}
