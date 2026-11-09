const STORAGE_KEY = 'eea.pending-capture-job'

export type PendingCaptureJob = {
  jobId: string
  submissionId: string
  filename: string
  startedAt: string
}

export function loadPendingCaptureJob(): PendingCaptureJob | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingCaptureJob
    if (!parsed.jobId || !parsed.submissionId) return null
    return parsed
  } catch {
    return null
  }
}

export function savePendingCaptureJob(job: PendingCaptureJob) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job))
}

export function clearPendingCaptureJob() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
