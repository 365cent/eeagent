'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, Spin, Tag, Typography } from 'antd'
import { PageHeader } from '@/components/shared/page-header'
import { QueryFailure } from '@/components/shared/query-failure'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { FunctionDerivationEditor } from '@/components/technology/function-derivation-editor'
import { LandingPointWorkbench } from '@/components/technology/landing-point-workbench'
import { eeaQueryKeys, usePanoramaStages } from '@/hooks/use-eea-queries'
import { fetchLandingPoints } from '@/lib/api/eea-api'

const { Text } = Typography

export function TechnologyView() {
  const panoramaQuery = usePanoramaStages()
  const landingDetailsQuery = useQuery({
    queryKey: eeaQueryKeys.landingPoints,
    queryFn: () => fetchLandingPoints(),
  })
  const stages = panoramaQuery.data ?? []
  const landingDetailsById = new Map((landingDetailsQuery.data ?? []).map((point) => [point.id, point]))
  const hasPanoramaRecords = stages.some((stage) =>
    stage.demand_count > 0 || stage.landing_point_count > 0 || stage.demand_points.length > 0,
  )

  return (
    <>
      <PageHeader eyebrow="04 · 功能与技术拆解" title="技术全景图" description="按价值链环节展开需求点、车辆功能与技术落脚点，建立技术地图。" />
      <FunctionDerivationEditor />
      <LandingPointWorkbench />
      {landingDetailsQuery.isError ? (
        <QueryFailure message="落脚点角色说明加载失败，请检查服务连接后重试。" onRetry={() => { void landingDetailsQuery.refetch() }} />
      ) : null}
      {panoramaQuery.isError ? (
        <QueryFailure message="技术全景加载失败，请检查服务连接后重试。" onRetry={() => { void panoramaQuery.refetch() }} />
      ) : panoramaQuery.isLoading ? (
        <Spin />
      ) : !hasPanoramaRecords ? (
        <PlatformEmptyState title="暂无技术落脚点" description="需求与车辆功能形成有效推导并保存落脚点后，将在此显示真实技术全景。" />
      ) : (
        <div className="panorama-grid">
          {stages.map((stage) => {
            const landingPointRows = stage.demand_points.flatMap((demand) =>
              demand.functions.flatMap((vehicleFunction) =>
                vehicleFunction.landing_points.map((landingPoint) => ({
                  ...landingPoint,
                  demandName: demand.name,
                  functionName: vehicleFunction.name,
                  roleDescription: landingDetailsById.get(landingPoint.id)?.role_description ?? null,
                })),
              ),
            )

            return (
              <Card
                className="panel-card panorama-column"
                key={stage.stage_code}
                title={<span><span className="stage-marker" />{stage.stage_label}</span>}
                extra={<Tag>{stage.demand_count} 个需求</Tag>}
              >
                {landingPointRows.length ? landingPointRows.map((item) => (
                  <div className="landing-card" key={item.id}>
                    <div className="landing-head"><Text strong>{item.name}</Text><Tag color="blue">{item.domain_name}</Tag></div>
                    <Text type="secondary">需求：{item.demandName}</Text>
                    <Text type="secondary">车辆功能：{item.functionName}</Text>
                    <Text type="secondary">功能内角色：{landingDetailsQuery.isSuccess ? item.roleDescription || '未填写' : '正在加载中'}</Text>
                    <div className="landing-footer"><span>{item.standard_count} 个部署标准</span></div>
                  </div>
                )) : <Text type="secondary">该环节暂无技术落脚点。</Text>}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
