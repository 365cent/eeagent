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
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.vocab('tech_tag') })
  }

  const patchClassification = useMutation({
    mutationFn: (input: Pick<SignalUpdatePayload, 'value_chain_stage_code' | 'signal_type_code'>) => {
      if (!signalId) throw new Error('missing signal id')
      return patchSignal(signalId, input)
    },
    onSuccess: () => void invalidate(),
  })

  const setTags = useMutation({
    mutationFn: (tagNames: string[]) => {
      if (!signalId) throw new Error('missing signal id')
      const payload: TagAssignmentPayload = { tag_names: tagNames }
      return putSignalTags(signalId, payload)
    },
    onSuccess: () => void invalidate(),
  })

  const setTheme = useMutation({
    mutationFn: (techThemeId: string | null) => {
      if (!signalId) throw new Error('missing signal id')
      const payload: ThemeAssignmentPayload = { tech_theme_id: techThemeId }
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
