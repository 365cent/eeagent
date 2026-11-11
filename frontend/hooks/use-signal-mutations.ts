'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  patchSignal,
  postSignalAutoAggregate,
  putSignalTags,
  putSignalTheme,
} from '@/lib/api/eea-api'
import type { SignalUpdatePayload, TagAssignmentPayload, ThemeAssignmentPayload } from '@/lib/api/types'
import { eeaQueryKeys } from '@/lib/query/eea-query-keys'

export function useSignalMutations(signalId: string | undefined, expectedUpdatedAt?: string | null) {
  const queryClient = useQueryClient()

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.signalsRoot })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
    if (signalId) {
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.signal(signalId) })
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.audit(signalId) })
    }
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themes })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.vocabUsage })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.vocab('tech_tag') })
  }

  const patchClassification = useMutation({
    mutationFn: (input: Pick<SignalUpdatePayload, 'value_chain_stage_code' | 'signal_type_code'>) => {
      if (!signalId) throw new Error('missing signal id')
      return patchSignal(signalId, {
        ...input,
        expected_updated_at: expectedUpdatedAt ?? undefined,
      })
    },
    onSuccess: () => void invalidate(),
  })

  const setTags = useMutation({
    mutationFn: (tagNames: string[]) => {
      if (!signalId) throw new Error('missing signal id')
      const payload: TagAssignmentPayload = {
        tag_names: tagNames,
        expected_updated_at: expectedUpdatedAt ?? undefined,
      }
      return putSignalTags(signalId, payload)
    },
    onSuccess: () => void invalidate(),
  })

  const setTheme = useMutation({
    mutationFn: (techThemeId: string | null) => {
      if (!signalId) throw new Error('missing signal id')
      const payload: ThemeAssignmentPayload = {
        tech_theme_id: techThemeId,
        expected_updated_at: expectedUpdatedAt ?? undefined,
      }
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
