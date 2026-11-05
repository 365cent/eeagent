'use client'

import type { ComponentType, ReactNode } from 'react'
import { isValidElement } from 'react'
import {
  AppstoreOutlined,
  BulbOutlined,
  FileSearchOutlined,
  HomeOutlined,
  RadarChartOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { mainMenuEntries } from '@/config/menu'
import { utilityPages } from '@/config/utility-pages'
import type { PlatformSearchKind } from '@/lib/platform-search-index'

type IconComponent = ComponentType<{ className?: string }>

function iconComponentFromNode(icon: ReactNode): IconComponent {
  if (isValidElement(icon) && typeof icon.type !== 'string') {
    return icon.type as IconComponent
  }
  return RadarChartOutlined
}

const navIconByKey: Record<string, IconComponent> = Object.fromEntries(
  mainMenuEntries.map((entry) => [entry.key, iconComponentFromNode(entry.icon)]),
)

const utilityIconByKey: Record<string, IconComponent> = Object.fromEntries(
  Object.entries(utilityPages).map(([key, page]) => [key, iconComponentFromNode(page.icon)]),
)

const kindIcon: Record<PlatformSearchKind, IconComponent> = {
  nav: HomeOutlined,
  signal: FileSearchOutlined,
  theme: TagsOutlined,
  demand: BulbOutlined,
  landing: AppstoreOutlined,
  action: RadarChartOutlined,
}

/** Same icons as the sider / utility pages — new element per row (do not reuse menu icon nodes). */
export function getPlatformSearchIcon(viewKey: string, kind: PlatformSearchKind): ReactNode {
  const Icon = navIconByKey[viewKey] ?? utilityIconByKey[viewKey] ?? kindIcon[kind] ?? RadarChartOutlined
  return <Icon />
}
