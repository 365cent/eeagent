'use client'

import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Divider, Row, Select, Space, Spin, Tag, Timeline, Typography } from 'antd'
import { QueryFailure } from '@/components/shared/query-failure'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { STANDARD_CONSTRAINTS, STANDARD_PHASES } from '@/features/technology/standards'
import { useLandingRows, useTraceChain } from '@/hooks/use-eea-queries'
import { EeaApiError, signalArchiveUrl, documentCanonicalUrl } from '@/lib/api/client'
import { formatApiDate } from '@/lib/eea-mappers'
import { basisFreshnessMeta } from '@/lib/basis-freshness'
import type { NavigateFn } from '@/types/platform'

const { Text, Paragraph } = Typography

export function DeductionChainWorkspace({ onNavigate, initialLandingPointId }: { onNavigate: NavigateFn; initialLandingPointId?: string }) {
  const [landingPointId, setLandingPointId] = useState<string | undefined>(initialLandingPointId)
  const landingQuery = useLandingRows()
  const traceQuery = useTraceChain(landingPointId)
  const trace = traceQuery.data
  useEffect(() => {
    setLandingPointId(initialLandingPointId || undefined)
  }, [initialLandingPointId])
  const stageNames: Record<string, string> = {
    landing_point: '技术落脚点',
    vehicle_function: '车辆功能',
    demand_point: '需求点',
    theme: '技术主题',
    signals: '原始信号',
  }
  const forwardSteps = Array.isArray(trace?.vehicle_function?.forward_trace?.steps)
    ? trace.vehicle_function.forward_trace.steps
    : []
  const demandSteps = trace?.demand_point?.derivation_trace?.steps ?? []

  return (
    <div className="deduction-workspace">
      <Card className="panel-card" title="选择技术落脚点">
        {landingQuery.isError ? (
          <QueryFailure message="技术落脚点加载失败，请检查服务连接后重试。" onRetry={() => { void landingQuery.refetch() }} />
        ) : (
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            loading={landingQuery.isLoading}
            value={landingPointId}
            onChange={(value) => {
              setLandingPointId(value)
              onNavigate(value ? `traceDetail/${value}` : 'traceDetail')
            }}
            placeholder="选择已保存的技术落脚点以查看来源链路"
            options={landingQuery.rows.map((row) => ({ value: row.key, label: row.name }))}
            style={{ width: '100%' }}
          />
        )}
      </Card>
      {traceQuery.isError ? (
        traceQuery.error instanceof EeaApiError && [404, 422].includes(traceQuery.error.status) ? (
          <Alert
            type="warning"
            showIcon
            title="无法打开这条追溯链"
            description={traceQuery.error.status === 404 ? '该技术落脚点已不存在，可能是链接过期或记录已删除。' : '追溯链接中的技术落脚点编号无效。'}
            action={<Button size="small" onClick={() => onNavigate('traceDetail')}>重新选择落脚点</Button>}
          />
        ) : (
          <QueryFailure message="推导链加载失败，请检查服务连接后重试。" onRetry={() => { void traceQuery.refetch() }} />
        )
      ) : traceQuery.isLoading ? (
        <Spin />
      ) : trace ? (
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          {!trace.completeness.complete ? (
            <Alert
              type="warning"
              showIcon
              title="推导链存在缺失或失效引用"
              description={[
                trace.completeness.missing_stages.length
                  ? `缺少环节：${trace.completeness.missing_stages.map((stage) => stageNames[stage] ?? stage).join('、')}`
                  : '',
                trace.completeness.unresolved_evidence_signal_ids.length
                  ? `无法解析的信号引用：${trace.completeness.unresolved_evidence_signal_ids.join('、')}`
                  : '',
                trace.completeness.unresolved_document_ids.length
                  ? `无法解析的文档引用：${trace.completeness.unresolved_document_ids.join('、')}`
                  : '',
              ].filter(Boolean).join('；')}
            />
          ) : (
            <Alert type="success" showIcon title="当前链路的结构化关联完整。来源文件与图片对象仍需按各自链接核验。" />
          )}
          <Card className="panel-card" title="当前推导关系">
            <Space wrap>
              <Tag color="blue">技术域：{trace.landing_point.domain_name ?? '未关联'}</Tag>
              <Tag color={trace.function_published ? 'green' : 'orange'}>
                功能：{trace.vehicle_function?.name ?? '未关联'} · {trace.function_published ? '已发布' : trace.vehicle_function ? '未发布' : '未关联'}
              </Tag>
              <Tag color={trace.demand_review_status === 'confirmed' ? 'green' : 'orange'}>
                需求复核：{trace.demand_review_status ?? '无记录'}
              </Tag>
              <Tag>交叉验证：{trace.demand_cross_validation_conclusion ?? '无记录'}</Tag>
              <Tag>战略版本：{trace.assessment_versions.length}</Tag>
              {(() => {
                const meta = basisFreshnessMeta(trace.basis_freshness)
                return (
                  <Tag color={meta.color} title={meta.description}>
                    依据状态：{meta.title}
                  </Tag>
                )
              })()}
            </Space>
            <Row gutter={[18, 18]} style={{ marginTop: 16 }}>
              <Col xs={24} sm={12} lg={6}><Text strong>技术落脚点</Text><div>{trace.landing_point.name}</div></Col>
              <Col xs={24} sm={12} lg={6}><Text strong>车辆功能</Text><div>{trace.vehicle_function?.name ?? '未关联'}</div></Col>
              <Col xs={24} sm={12} lg={6}><Text strong>需求点</Text><div>{trace.demand_point?.name ?? '未关联'}</div></Col>
              <Col xs={24} sm={12} lg={6}><Text strong>技术主题</Text><div>{trace.theme?.working_name ?? '未关联'}</div></Col>
            </Row>
          </Card>

          <Card className="panel-card" title="需求推导与交叉验证">
            {trace.demand_point ? (
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                {demandSteps.length ? demandSteps.map((step, index) => (
                  <Card key={`${step.key}-${index}`} size="small" title={`${index + 1}. ${step.key}`}>
                    <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{step.content}</Paragraph>
                    <Space wrap>
                      {step.evidence_signal_ids.map((id) => (
                        <Button key={id} type="link" onClick={() => onNavigate(`singal/${id}`)}>
                          回到证据 {id.slice(0, 8)}
                        </Button>
                      ))}
                    </Space>
                  </Card>
                )) : <Text type="secondary">没有保存需求五步推导记录。</Text>}
                <Paragraph type="secondary">
                  交叉验证结论：{trace.demand_cross_validation_conclusion ?? '未记录'}；
                  需求状态：{trace.demand_review_status ?? '未复核'}。
                </Paragraph>
              </Space>
            ) : <Text type="secondary">该功能未关联需求点。</Text>}
          </Card>

          <Card className="panel-card" title="车辆功能推导与反向验证">
            {trace.vehicle_function ? (
              <Row gutter={[18, 18]}>
                <Col xs={24} lg={12}>
                  <Text strong>正向五步</Text>
                  {forwardSteps.length ? (
                    <ol>{forwardSteps.map((step, index) => (
                      <li key={index}><Paragraph style={{ whiteSpace: 'pre-wrap' }}>{typeof step === 'string' ? step : JSON.stringify(step)}</Paragraph></li>
                    ))}</ol>
                  ) : <Paragraph type="secondary">未保存正向步骤。</Paragraph>}
                </Col>
                <Col xs={24} lg={12}>
                  <Text strong>反向验证记录</Text>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                    {trace.vehicle_function.reverse_trace
                      ? JSON.stringify(trace.vehicle_function.reverse_trace, null, 2)
                      : '未保存反向验证记录。'}
                  </Paragraph>
                </Col>
              </Row>
            ) : <Text type="secondary">该需求点尚未形成车辆功能。</Text>}
          </Card>

          <Card className="panel-card" title="部署标准九宫格">
            <Row gutter={[12, 12]}>
              {STANDARD_PHASES.map((phase) => STANDARD_CONSTRAINTS.map((constraint) => {
                const cell = trace.standards.find((item) => item.phase === phase && item.constraint_type === constraint)
                const text = cell
                  ? cell.requirement_text?.trim() || '已明确留空'
                  : '尚未填写'
                return (
                  <Col key={`${phase}-${constraint}`} xs={24} sm={12} lg={8}>
                    <Card size="small" title={`${phase} · ${constraint}`}>
                      <Text type={cell?.requirement_text?.trim() ? undefined : 'secondary'}>{text}</Text>
                    </Card>
                  </Col>
                )
              }))}
            </Row>
          </Card>

          <Card className="panel-card" title="原始信号、文件与图片">
            {trace.signals.length ? (
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                {trace.signals.map((signal) => (
                  <Card key={signal.id} size="small" title={(
                    <Space wrap>
                      <Text strong>{signal.title}</Text>
                      {signal.trace_relationships.includes('theme_member') ? <Tag color="blue">主题成员</Tag> : null}
                      {signal.trace_relationships.includes('demand_evidence') ? <Tag color="purple">需求直接证据</Tag> : null}
                      {signal.is_archived ? <Tag color="orange">已归档/停用</Tag> : <Tag color="green">{signal.evidence_status_code}</Tag>}
                    </Space>
                  )}>
                    <Space wrap>
                      <Text type="secondary">发布主体：{signal.publisher ?? '未记录'}</Text>
                      <Text type="secondary">更新时间：{formatApiDate(signal.updated_at)}</Text>
                      <Button type="link" onClick={() => onNavigate(`singal/${signal.id}`)}>打开证据</Button>
                      {signal.archive_reference_present ? (
                        <Button type="link" href={signalArchiveUrl(signal.id)} target="_blank" rel="noreferrer">查看网页存档</Button>
                      ) : null}
                    </Space>
                    {signal.document ? (
                      <Space wrap style={{ display: 'flex', marginTop: 8 }}>
                        <Text>文档：{signal.document.filename ?? signal.document.id}</Text>
                        <Tag>{signal.document.ingest_status}</Tag>
                        <Tag>{signal.document.figure_count} 张图块</Tag>
                        {signal.document.canonical_object_reference_present ? (
                          <Button type="link" href={documentCanonicalUrl(signal.document.id)} target="_blank" rel="noreferrer">
                            打开文档正文
                          </Button>
                        ) : <Text type="secondary">尚无可用的规范正文对象</Text>}
                        {signal.document.figure_count > 0 ? (
                          <Button type="link" onClick={() => onNavigate(`singal/${signal.id}`)}>在证据页查看图片</Button>
                        ) : null}
                      </Space>
                    ) : null}
                  </Card>
                ))}
              </Space>
            ) : <PlatformEmptyState title="暂无关联信号" description="该落脚点的主题和证据链目前没有可回溯的信号记录。" />}
          </Card>

          <Card className="panel-card" title="部署边界与战略版本">
            <Row gutter={[18, 18]}>
              <Col xs={24} lg={12}>
                <Text strong>当前部署边界证据</Text>
                {trace.standards.filter((item) => item.requirement_text?.trim()).length ? (
                  <ul>{trace.standards.filter((item) => item.requirement_text?.trim()).map((item) => (
                    <li key={item.id}>{item.phase} · {item.constraint_type}：{item.requirement_text}</li>
                  ))}</ul>
                ) : <Paragraph type="secondary">没有非空部署标准；系统未补写内容。</Paragraph>}
              </Col>
              <Col xs={24} lg={12}>
                {trace.assessment_versions.length ? (
                  <Timeline items={trace.assessment_versions.map((assessment) => ({
                    color: assessment.is_current ? 'green' : 'blue',
                    children: (
                      <Space orientation="vertical" size={4}>
                        <Space wrap>
                          <Text strong>v{assessment.version}</Text>
                          <Tag color={assessment.is_current ? 'green' : 'default'}>{assessment.is_current ? '当前版本' : '历史版本'}</Tag>
                          <Text>{assessment.classification}</Text>
                          <Text>总分 {assessment.score_total}/25</Text>
                        </Space>
                        <Text type="secondary">操作者：{assessment.operator_subject ?? '—'} · {formatApiDate(assessment.assessed_at)}</Text>
                        <Paragraph type="secondary">{assessment.strategy_note ?? '未填写策略备注'}</Paragraph>
                      </Space>
                    ),
                  }))} />
                ) : <Text type="secondary">尚无已定稿战略版本。</Text>}
              </Col>
            </Row>
            <Divider />
            <Alert
              type="info"
              showIcon
              title="依据更新状态：无法确认"
              description="当前数据模型没有需求复核时间基线，系统不会推断信号或标签更新后是否需要重新复核。"
            />
          </Card>
        </Space>
      ) : landingPointId ? (
        <PlatformEmptyState title="暂无推导链" description="该落脚点尚无服务端返回的推导关系。" />
      ) : (
        <PlatformEmptyState title="请选择落脚点" description="当前展示真实已保存的落脚点链路，不生成示例节点或推导结论。" />
      )}
    </div>
  )
}

