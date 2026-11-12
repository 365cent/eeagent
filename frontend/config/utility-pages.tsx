'use client'

import type { ReactNode } from 'react'
import {
  BellOutlined,
  BookOutlined,
  BulbOutlined,
  CheckCircleFilled,
  CloudDownloadOutlined,
  FilePdfOutlined,
  FileSearchOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'

export type UtilityPageConfig = {
  eyebrow: string
  title: string
  description: string
  action: string
  icon: ReactNode
}

export const utilityPages: Record<string, UtilityPageConfig> = {
  newSignal: { eyebrow: '06 · 原始信息采集', title: '新建信号', description: '粘贴链接或录入研究线索，系统将生成可追溯的信号记录。', action: '保存信号', icon: <PlusOutlined /> },
  createTopic: { eyebrow: '02 · 需求点提取', title: '新建主题', description: '创建一个研究主题，聚合相关证据并持续沉淀洞察。', action: '创建主题', icon: <PlusOutlined /> },
  report: { eyebrow: '07 · 研究交付', title: '链路报告', description: '按技术落脚点生成持久化 Markdown 链路报告，并预览最近导出。', action: '生成 Markdown', icon: <FilePdfOutlined /> },
  notifications: { eyebrow: '08 · 工作提醒', title: '通知中心', description: '查看复核、抓取与协作任务的最新状态。', action: '全部标记已读', icon: <BellOutlined /> },
  search: { eyebrow: '09 · 全局检索', title: '搜索结果', description: '跨信号、主题、需求点和技术落脚点检索研究资产。', action: '保存检索', icon: <SearchOutlined /> },
  profile: { eyebrow: '10 · 个人空间', title: '用户资料', description: '管理个人研究偏好、工作空间和最近访问记录。', action: '保存资料', icon: <UserOutlined /> },
  settings: { eyebrow: '11 · 平台管理', title: '平台设置', description: '配置工作空间、通知策略与会话安全。', action: '保存设置', icon: <SettingOutlined /> },
  singal: { eyebrow: '12 · 证据详情', title: '信号详情', description: '查看信号来源、原文摘要、标签和证据链。', action: '加入主题', icon: <FileSearchOutlined /> },
  traceDetail: { eyebrow: '13 · 推导流水线', title: '推导流水线', description: '从原始信号到技术落脚点，查看每一步判断的依据与置信度。', action: '导出推导链', icon: <CloudDownloadOutlined /> },
  reminders: { eyebrow: '14 · 研究节奏', title: '本周研究提醒', description: '按优先级查看本周需要复核、补录和发布的任务。', action: '完成本周计划', icon: <BulbOutlined /> },
  knowledge: { eyebrow: '15 · 研究方法', title: '方法论映射', description: '维护研究方法、标签词表与机器预标规则。', action: '新增词条', icon: <BookOutlined /> },
  workflow: { eyebrow: '16 · 研究交付', title: '交付工作流', description: '把选型、采集、标注、推导、研判与交接串成可验证闭环。', action: '确认阶段', icon: <CheckCircleFilled /> },
}

export function utilityPageTitle(key: string): string | undefined {
  return utilityPages[key]?.title
}
