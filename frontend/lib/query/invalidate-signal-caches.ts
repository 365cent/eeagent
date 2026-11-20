import type { QueryClient } from '@tanstack/react-query'
import { eeaQueryKeys } from '@/lib/query/eea-query-keys'

export type InvalidateSignalCachesOptions = {
  signalId?: string
  documentId?: string | null
  /** Drop cached signal detail (e.g. after permanent delete). */
  removeSignalDetail?: boolean
}

/** Refetch list/table/overview (and optional signal + document panels) after archive or delete. */
export async function invalidateSignalCaches(
  queryClient: QueryClient,
  options: InvalidateSignalCachesOptions = {},
) {
  const { signalId, documentId, removeSignalDetail } = options
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: eeaQueryKeys.signalsRoot }),
    queryClient.invalidateQueries({ queryKey: eeaQueryKeys.signalsPageRoot }),
    queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview }),
    queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themes }),
    queryClient.invalidateQueries({ queryKey: eeaQueryKeys.vocabUsage }),
  ])
  if (signalId) {
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.signal(signalId) })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.audit(signalId) })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.tagSuggestions(signalId) })
    if (removeSignalDetail) {
      queryClient.removeQueries({ queryKey: eeaQueryKeys.signal(signalId) })
    }
  }
  if (documentId) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentDetail(documentId) }),
      queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentChunks(documentId) }),
      queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentFigures(documentId) }),
      queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentKeywords(documentId) }),
    ])
  }
  await queryClient.refetchQueries({ queryKey: eeaQueryKeys.signalsPageRoot, type: 'active' })
  await queryClient.refetchQueries({ queryKey: eeaQueryKeys.signalsRoot, type: 'active' })
}