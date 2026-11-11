'use client'

import { Button, Card, Spin, Table } from 'antd'
import { PageHeader } from '@/components/shared/page-header'
import { QueryFailure } from '@/components/shared/query-failure'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { usePanoramaStages } from '@/hooks/use-eea-queries'
import type { NavigateFn } from '@/types/platform'

export function TraceView({ onNavigate }: { onNavigate: NavigateFn }) {
  const panoramaQuery = usePanoramaStages()
  const stages = panoramaQuery.data ?? []
  const relationships = stages.flatMap((stage) =>
    stage.demand_points.flatMap((demand) =>
      demand.functions.flatMap((vehicleFunction) =>
        vehicleFunction.landing_points.map((landingPoint) => ({
          key: `${stage.stage_code}-${demand.id}-${vehicleFunction.id}-${landingPoint.id}`,
          stage: stage.stage_label,
          demand: demand.name,
          vehicleFunction: vehicleFunction.name,
          landingPoint: landingPoint.name,
        landingPointId: landingPoint.id,
          domain: landingPoint.domain_name,
        })),
      ),
    ),
  )

  return (
    <>
      <PageHeader eyebrow="03 · 需求与功能映射" title="链路追溯" description="查看服务端已保存的需求、车辆功能与技术落脚点关系。" />
      {panoramaQuery.isError ? (
        <QueryFailure message="链路数据加载失败，请检查服务连接后重试。" onRetry={() => { void panoramaQuery.refetch() }} />
      ) : panoramaQuery.isLoading ? (
        <Spin />
      ) : relationships.length === 0 ? (
        <PlatformEmptyState title="暂无可追溯链路" description="保存真实需求、车辆功能和技术落脚点关系后，链路将在此显示。" />
      ) : (
        <Card className="panel-card view-card" title="已保存的推导关系">
          <Table
            rowKey="key"
            dataSource={relationships}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '价值链环节', dataIndex: 'stage' },
              { title: '需求点', dataIndex: 'demand' },
              { title: '车辆功能', dataIndex: 'vehicleFunction' },
              { title: '技术落脚点', dataIndex: 'landingPoint' },
              { title: '技术域', dataIndex: 'domain' },
              {
                title: '操作',
                key: 'action',
                render: (_value: unknown, record: (typeof relationships)[number]) => (
                  <Button type="link" onClick={() => onNavigate(`traceDetail/${record.landingPointId}`)}>
                    查看完整链路
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}
    </>
  )
}
