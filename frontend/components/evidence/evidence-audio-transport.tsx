'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PauseOutlined, CaretRightOutlined, BorderOutlined } from '@ant-design/icons'
import { Button, Space, Typography } from 'antd'
import { buildAudioOverviewSegments, type AudioOverviewSegment } from '@/lib/evidence/audio-overview-segments'
import { clearArticleHighlights, highlightQuoteInArticle } from '@/lib/evidence/highlight-quote'

const { Text } = Typography

type UseEvidenceAudioOverviewOptions = {
  markdown: string
  articleRef: React.RefObject<HTMLElement | null>
}

function pickZhVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang.startsWith('zh')) ??
    voices.find((v) => v.lang.includes('CN')) ??
    null
  )
}

function useEvidenceAudioOverview({ markdown, articleRef }: UseEvidenceAudioOverviewOptions) {
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [segmentIndex, setSegmentIndex] = useState(0)
  const segmentsRef = useRef<AudioOverviewSegment[]>([])
  const cleanupHighlightRef = useRef<(() => void) | null>(null)
  const indexRef = useRef(0)

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    cleanupHighlightRef.current?.()
    cleanupHighlightRef.current = null
    if (articleRef.current) clearArticleHighlights(articleRef.current)
    setPlaying(false)
    setPaused(false)
    setSegmentIndex(0)
    indexRef.current = 0
  }, [articleRef])

  const speakNext = useCallback(() => {
    const segments = segmentsRef.current
    const idx = indexRef.current
    if (idx >= segments.length) {
      stop()
      return
    }
    const segment = segments[idx]
    setSegmentIndex(idx)
    if (articleRef.current) {
      cleanupHighlightRef.current?.()
      cleanupHighlightRef.current = highlightQuoteInArticle(articleRef.current, segment.quote)
    }

    const utterance = new SpeechSynthesisUtterance(segment.text)
    const voice = pickZhVoice()
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? 'zh-CN'
    utterance.rate = 1
    utterance.onend = () => {
      indexRef.current += 1
      speakNext()
    }
    utterance.onerror = () => {
      indexRef.current += 1
      speakNext()
    }
    window.speechSynthesis.speak(utterance)
  }, [articleRef, stop])

  const play = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
      setPlaying(true)
      return
    }
    stop()
    segmentsRef.current = buildAudioOverviewSegments(markdown)
    if (segmentsRef.current.length === 0) return
    indexRef.current = 0
    setPlaying(true)
    speakNext()
  }, [markdown, paused, speakNext, stop])

  const pause = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.pause()
    setPaused(true)
    setPlaying(false)
  }, [])

  useEffect(() => {
    return () => stop()
  }, [markdown, stop])

  useEffect(() => {
    const onVoices = () => pickZhVoice()
    window.speechSynthesis?.addEventListener('voiceschanged', onVoices)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', onVoices)
  }, [])

  return {
    playing,
    paused,
    segmentIndex,
    play,
    pause,
    stop,
    canPlay: Boolean(markdown.trim()),
  }
}

type EvidenceAudioTransportProps = {
  markdown: string
  articleRef: React.RefObject<HTMLElement | null>
}

export function EvidenceAudioTransport({ markdown, articleRef }: EvidenceAudioTransportProps) {
  const { playing, paused, segmentIndex, play, pause, stop, canPlay } = useEvidenceAudioOverview({
    markdown,
    articleRef,
  })

  if (!canPlay) return null

  const previewTotal = buildAudioOverviewSegments(markdown).length

  return (
    <div className="evidence-audio-transport">
      <Space wrap size={8}>
        {!playing && !paused ? (
          <Button type="primary" size="small" icon={<CaretRightOutlined />} onClick={play}>
            播放概览
          </Button>
        ) : playing ? (
          <Button size="small" icon={<PauseOutlined />} onClick={pause}>
            暂停
          </Button>
        ) : (
          <Button type="primary" size="small" icon={<CaretRightOutlined />} onClick={play}>
            继续
          </Button>
        )}
        <Button size="small" icon={<BorderOutlined />} disabled={!playing && !paused} onClick={stop}>
          停止
        </Button>
        {(playing || paused) && previewTotal > 0 ? (
          <Text type="secondary" className="evidence-audio-transport-meta">
            第 {segmentIndex + 1} / {previewTotal} 段
          </Text>
        ) : null}
      </Space>
    </div>
  )
}
