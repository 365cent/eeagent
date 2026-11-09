'use client'

import { Empty, Typography } from 'antd'

const { Text } = Typography

export function DeductionChainRadar() {
  return (
    <Empty
      description={(
        <Text type="secondary">
          当前没有可展示的真实链路数据。请选择一个已保存的技术落脚点查看服务端返回的推导关系。
        </Text>
      )}
    />
  )
}
