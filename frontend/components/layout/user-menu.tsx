'use client'

import { useMemo } from 'react'
import { DownOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import { App as AntApp, Avatar, Button, Dropdown, Typography } from 'antd'
import type { MenuProps } from 'antd'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

type UserMenuProps = {
  onNavigate: NavigateFn
}

export function UserMenu({ onNavigate }: UserMenuProps) {
  const { message: messageApi } = AntApp.useApp()

  const userMenuItems: MenuProps['items'] = useMemo(
    () => [
      { key: 'profile', label: '用户资料', icon: <UserOutlined /> },
      { key: 'settings', label: '平台设置', icon: <SettingOutlined /> },
      { type: 'divider' },
      { key: 'logout', label: '退出登录', danger: true },
    ],
    [],
  )

  const onUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      messageApi.info('退出登录（演示）')
      return
    }
    onNavigate(String(key))
  }

  return (
    <Dropdown menu={{ items: userMenuItems, onClick: onUserMenuClick }} trigger={['click']} placement="bottomRight">
      <Button type="text" className="user-profile-trigger" aria-label="打开用户菜单">
        <Avatar size={32} className="user-profile-avatar">LW</Avatar>
        <span className="user-profile-copy">
          <Text strong className="user-profile-name">刘文</Text>
          <Text type="secondary" className="user-profile-role">战略研究员</Text>
        </span>
        <DownOutlined className="user-profile-caret" />
      </Button>
    </Dropdown>
  )
}
