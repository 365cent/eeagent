'use client'

import { useMemo } from 'react'
import { DownOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import type { NavigateFn } from '@/types/platform'

type UserMenuProps = {
  onNavigate: NavigateFn
}

export function UserMenu({ onNavigate }: UserMenuProps) {
  const userMenuItems: MenuProps['items'] = useMemo(
    () => [
      { key: 'profile', label: '用户资料', icon: <UserOutlined /> },
      { key: 'settings', label: '平台设置', icon: <SettingOutlined /> },
    ],
    [],
  )

  const onUserMenuClick: MenuProps['onClick'] = ({ key }) => onNavigate(String(key))

  return (
    <Dropdown menu={{ items: userMenuItems, onClick: onUserMenuClick }} trigger={['click']} placement="bottomRight">
      <Button type="text" className="user-profile-trigger" aria-label="打开用户菜单">
        <UserOutlined aria-hidden />
        <DownOutlined className="user-profile-caret" />
      </Button>
    </Dropdown>
  )
}
