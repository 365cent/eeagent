'use client'

import type { MenuProps } from 'antd'
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

/** Primary sider nav (icon + Chinese label). */
export const mainMenuEntries = [
  { key: 'overview', title: '工作台总览', icon: <HomeOutlined /> },
  { key: 'signals', title: '信号采集·证据库', icon: <RadarChartOutlined /> },
  { key: 'topics', title: '标签与主题归纳', icon: <TagsOutlined /> },
  { key: 'traceDetail', title: '推导流水线', icon: <BranchesOutlined /> },
  { key: 'technology', title: '技术全景图', icon: <AppstoreOutlined /> },
  { key: 'trace', title: '链条追踪与验收', icon: <FundProjectionScreenOutlined /> },
  { key: 'strategy', title: '战略研判', icon: <BarChartOutlined /> },
  { key: 'workflow', title: '交付工作流', icon: <CheckCircleFilled /> },
] as const

export const mainMenuItems: MenuProps['items'] = mainMenuEntries.map((entry) => ({
  key: entry.key,
  icon: entry.icon,
  label: entry.title,
}))

export const siderUtilityMenuItems: MenuProps['items'] = [
  { key: 'knowledge', icon: <BookOutlined />, label: '方法论映射' },
  { key: 'settings', icon: <SettingOutlined />, label: '平台设置' },
]

export function primaryMenuLabel(key: string): string | undefined {
  return mainMenuEntries.find((entry) => entry.key === key)?.title
}
