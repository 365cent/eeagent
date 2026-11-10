'use client'

import type { MenuProps } from 'antd'
import type { ReactNode } from 'react'
import {
  AppstoreOutlined,
  BarChartOutlined,
  BookOutlined,
  BranchesOutlined,
  CheckCircleFilled,
  FundProjectionScreenOutlined,
  HomeOutlined,
  RadarChartOutlined,
  SettingOutlined,
  TagsOutlined,
} from '@ant-design/icons'

export type MainMenuNode = {
  key: string
  title: string
  icon: ReactNode
}

/** Primary sider nav (icon + Chinese label); flat routes only. */
export const mainMenuTree: MainMenuNode[] = [
  { key: 'overview', title: '工作台总览', icon: <HomeOutlined /> },
  { key: 'signals', title: '信号采集·证据库', icon: <RadarChartOutlined /> },
  { key: 'topics', title: '标签与主题归纳', icon: <TagsOutlined /> },
  { key: 'traceDetail', title: '推导流水线', icon: <BranchesOutlined /> },
  { key: 'technology', title: '技术全景图', icon: <AppstoreOutlined /> },
  { key: 'trace', title: '链条追踪与验收', icon: <FundProjectionScreenOutlined /> },
  { key: 'strategy', title: '战略研判', icon: <BarChartOutlined /> },
  { key: 'workflow', title: '交付工作流', icon: <CheckCircleFilled /> },
]

export const mainMenuEntries = mainMenuTree.map((node) => ({
  key: node.key,
  title: node.title,
  icon: node.icon,
}))

export function flattenMainMenuLeafKeys(): string[] {
  return mainMenuTree.map((node) => node.key)
}

export function isMainMenuRoute(key: string): boolean {
  return flattenMainMenuLeafKeys().includes(key)
}

export function menuIconForKey(key: string): ReactNode | undefined {
  return mainMenuTree.find((node) => node.key === key)?.icon
}

export const mainMenuItems: MenuProps['items'] = mainMenuTree.map((node) => ({
  key: node.key,
  icon: node.icon,
  label: node.title,
}))

export const siderUtilityMenuItems: MenuProps['items'] = [
  { key: 'knowledge', icon: <BookOutlined />, label: '方法论映射' },
  { key: 'settings', icon: <SettingOutlined />, label: '平台设置' },
]

export function primaryMenuLabel(key: string): string | undefined {
  return mainMenuTree.find((node) => node.key === key)?.title
}
