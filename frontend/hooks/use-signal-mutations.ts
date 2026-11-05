'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  patchSignal,
  postSignalAutoAggregate,
  putSignalTags,
  putSignalTheme,
} from '@/lib/api/eea-api'
import type { SignalUpdatePayload, TagAssignmentPayload, ThemeAssignmentPayload } from '@/lib/api/types'
import { eeaQueryKeys } from '@/hooks/use-eea-queries'

async function resolveOperatorSubject(): Promise<string> {
  try {
    const { fetchSessionMe } = await import('@/lib/api/eea-api')
    const me = await fetchSessionMe()
    return me.ip || 'local-admin'
  } catch {
    return 'local-admin'
  }
}

export function useSignalMutations(signalId: string | undefined) {
  const queryClient = useQueryClient()

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['eea', 'signals'] })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
    if (signalId) {
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.signal(signalId) })
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.audit(signalId) })
    }
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themes })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.vocabUsage })
  }

  const patchClassification = useMutation({
    mutationFn: async (input: Pick<SignalUpdatePayload, 'value_chain_stage_code' | 'signal_type_code'>) => {
      if (!signalId) throw new Error('missing signal id')
      const operator_subject = await resolveOperatorSubject()
      return patchSignal(signalId, { ...input, operator_subject })
    },
    onSuccess: () => void invalidate(),
  })

  const setTags = useMutation({
    mutationFn: async (tagNames: string[]) => {
      if (!signalId) throw new Error('missing signal id')
      const operator_subject = await resolveOperatorSubject()
      const payload: TagAssignmentPayload = { tag_names: tagNames, operator_subject }
      return putSignalTags(signalId, payload)
    },
    onSuccess: () => void invalidate(),
  })

  const setTheme = useMutation({
    mutationFn: async (techThemeId: string | null) => {
      if (!signalId) throw new Error('missing signal id')
      const operator_subject = await resolveOperatorSubject()
      const payload: ThemeAssignmentPayload = { tech_theme_id: techThemeId, operator_subject }
      return putSignalTheme(signalId, payload)
    },
    onSuccess: () => void invalidate(),
  })

  const autoAggregate = useMutation({
    mutationFn: async () => {
      if (!signalId) throw new Error('missing signal id')
      return postSignalAutoAggregate(signalId)
    },
    onSuccess: () => void invalidate(),
  })

  return { setTags, setTheme, autoAggregate, patchClassification, invalidate }
}
