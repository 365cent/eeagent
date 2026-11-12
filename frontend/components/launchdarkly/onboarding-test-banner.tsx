'use client'

import { Alert, Button } from 'antd'
import { useFlags } from 'launchdarkly-react-client-sdk'

export const LAUNCHDARKLY_ONBOARDING_FLAG_KEY = 'launchdarkly-onboarding-banner'

const FLAG_TARGETING_URL =
  'https://app.launchdarkly.com/projects/default/flags/launchdarkly-onboarding-banner/targeting?env=test'

const FLAG_CREATE_URL =
  'https://app.launchdarkly.com/projects/default/flags/new?key=launchdarkly-onboarding-banner'

type BannerBodyProps = {
  on: boolean
  connected: boolean
}

function BannerBody({ on, connected }: BannerBodyProps) {
  const title = on
    ? 'LaunchDarkly test banner (flag is on)'
    : 'LaunchDarkly test banner (flag is off)'

  const flagUrl = connected ? FLAG_TARGETING_URL : FLAG_CREATE_URL
  const linkLabel = connected ? 'View in LaunchDarkly' : 'Create flag in LaunchDarkly'

  return (
    <Alert
      className="launchdarkly-onboarding-banner"
      type={on ? 'success' : 'info'}
      showIcon
      title={title}
      action={
        <Button type="link" size="small" href={flagUrl} target="_blank" rel="noopener noreferrer">
          {linkLabel}
        </Button>
      }
    />
  )
}

function ConnectedOnboardingBanner() {
  const flags = useFlags()
  const on = flags[LAUNCHDARKLY_ONBOARDING_FLAG_KEY] === true
  return <BannerBody on={on} connected />
}

/** Small banner for the onboarding flag reveal; safe when LaunchDarkly is not configured. */
export function LaunchDarklyOnboardingBanner() {
  const clientSideID = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID?.trim()

  if (!clientSideID) {
    return <BannerBody on={false} connected={false} />
  }

  return <ConnectedOnboardingBanner />
}
