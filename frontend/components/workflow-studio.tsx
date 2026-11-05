'use client'

import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Checkbox, Col, Divider, Input, Progress, Row, Select, Space, Statistic, Steps, Tag, Typography, Upload } from 'antd'
import { CheckCircleFilled, FileAddOutlined, SafetyCertificateOutlined, UploadOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

type Task = { id: string; label: string; detail: string; required?: boolean }
type Workflow = { key: string; title: string; subtitle: string; tasks: Task[] }

const workflows: Workflow[] = [
  { key: 'w1', title: '选型与准备', subtitle: '完成技术栈、账号、数据结构与研究入口准备', tasks: [
    { id: 'stack', label: '完成技术栈选型与大模型接口账号申请', detail: '确认前端框架、模型供应商与调用边界', required: true },
    { id: 'schema', label: '完成数据表结构设计', detail: '信号、证据、主题、需求点和版本关系已定义', required: true },
    { id: 'research', label: '完成同类平台调研', detail: '记录可借鉴的交互与信息架构' },
    { id: 'scope', label: '参与技术栈与平台形态确认', detail: '确认部署、权限和可用性约束' },
  ] },
  { key: 'w2', title: '资料可采集、可留存', subtitle: '让每条证据可抓取、可验证、可回溯', tasks: [
    { id: 'db', label: '按定稿结构建库，提供一次性建库脚本', detail: '保持字段稳定并记录迁移版本', required: true },
    { id: 'shell', label: '搭建前后端框架，完成八个页面入口', detail: '入口、空态、错误态与权限边界可访问', required: true },
    { id: 'capture', label: '实现链接抓取，自动获取标题、正文、来源、发布时间与原文留存证', detail: '抓取结果必须带来源链接与原文快照', required: true },
    { id: 'detail', label: '完成证据列表页与详情页', detail: '支持来源、标签和更新时间查看' },
    { id: 'verify', label: '提供实测链接 20 条，网页与公众号 10 条，逐条注明技术方向', detail: '保留验证记录与异常原因' },
    { id: 'vocab', label: '核定五类词表用字，只改用字、不改结构', detail: '词表变更进入审核记录' },
  ] },
  { key: 'w3', title: '标签可自动生成并人工修正', subtitle: '机器提议、人工确认、全程留痕', tasks: [
    { id: 'extract', label: '接入大模型接口，生成价值链环节、信号类型、技术方向三项标签建议', detail: '建议结果必须展示置信度与原文依据', required: true },
    { id: 'edit', label: '标签可下拉修正，选项取自词表', detail: '不允许输入未登记词项', required: true },
    { id: 'audit', label: '记录每次修正的原值、新值、人员与时间', detail: '形成不可覆盖的修正历史' },
    { id: 'aggregate', label: '完成标签页与主题页，可归集并回溯证据', detail: '聚合指标明确区分信号数与来源数' },
    { id: 'efuse', label: '提供 eFuse 案例两条信号原文，逐条核对标签结果并修正', detail: '保存原文、建议值和最终值' },
    { id: 'criteria', label: '确定低频强信号的判定标准', detail: '展示标准与命中记录' },
  ] },
  { key: 'w4', title: '环节一至六贯通（关键周）', subtitle: '从信号到技术落脚点形成可发布的闭环', tasks: [
    { id: 'forward', label: '正向五步推导表单，缺项不可保存', detail: '原始信号、解析、主题、需求点、技术落脚点', required: true },
    { id: 'reverse', label: '反向验证清单，正反结论不一致不可发布', detail: '每个结论都必须有证据引用', required: true },
    { id: 'function', label: '功能卡片含推荐等级、自动化等级、目标域、推荐原因、L2 与 L4 差异', detail: '支持逐卡确认' },
    { id: 'landing', label: '录入五个技术域的技术落脚点', detail: '技术域、标准、供应商与落地条件' },
    { id: 'grid', label: '部署标准九宫格，内容由研究员手工填写', detail: '系统不得自动填充九宫格' },
    { id: 'docs', label: '支持 Word、PDF 上传转写，文档内图片单独识别并生成说明', detail: '每个文件展示转写状态' },
  ] },
  { key: 'w5', title: '研判结论可输出', subtitle: '让评分、版本、报告与验收形成可追溯产物', tasks: [
    { id: 'funnel', label: '战略四步漏斗，前一步未通过不可进入下一步', detail: '逐步记录判断与通过原因', required: true },
    { id: 'score', label: '五维评分，各为 1 至 5 的整数，自动汇总', detail: '自动计算总分并给出三类策略建议', required: true },
    { id: 'version', label: '改判断痕迹，追加版本不覆盖原版本', detail: '对比版本差异与修改人' },
    { id: 'report', label: '分析报告生成，含追溯摘要', detail: '报告段落回链到证据与结论' },
    { id: 'assistant', label: '对话助手支持检索与建议，修改须人工确认后写入', detail: '建议态与已写入态明确区分' },
    { id: 'accept', label: '对照验收清单逐条确认，未通过项注明原因', detail: '签署、验收与发布记录分离' },
  ] },
  { key: 'w6', title: '交付与交接', subtitle: '把研究成果交付为可运行、可演示、可维护的产品', tasks: [
    { id: 'package', label: '打包运行环境，编写安装与维护说明', detail: '记录版本、依赖与回滚方式' },
    { id: 'demo', label: '编写演示脚本并录制', detail: '覆盖导入、修正、追溯与发布' },
    { id: 'perf', label: '性能测试：列表万条翻页 1 秒内，详情页 0.8 秒内', detail: '前端模拟面板展示目标与实测值' },
    { id: 'handoff', label: '整理汇报材料', detail: '关键结论、证据链和待办事项' },
    { id: 'independent', label: '在无人指导的情况下独立完成一次全流程操作并录屏', detail: '记录阻塞点与完成时间' },
    { id: 'instant', label: '新增一个技术标签，确认即时生效', detail: '词表更新后新旧页面行为一致' },
    { id: 'present', label: '参与演示与汇报', detail: '展示数据、方法和边界' },
  ] },
]

export function WorkflowStudio({ initial = 'w1' }: { initial?: string }) {
  const [active, setActive] = useState(initial)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const workflow = workflows.find((item) => item.key === active) ?? workflows[0]
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('eea-workflow-state')
      if (saved) setCompleted(JSON.parse(saved))
      setNotes(window.localStorage.getItem('eea-workflow-notes') ?? '')
    } catch { /* local persistence is optional */ }
  }, [])
  useEffect(() => { try { window.localStorage.setItem('eea-workflow-state', JSON.stringify(completed)) } catch {} }, [completed])
  useEffect(() => { try { window.localStorage.setItem('eea-workflow-notes', notes) } catch {} }, [notes])
  const done = workflow.tasks.filter((task) => completed[`${workflow.key}:${task.id}`]).length
  const requiredMissing = workflow.tasks.some((task) => task.required && !completed[`${workflow.key}:${task.id}`])
  const totalDone = Object.values(completed).filter(Boolean).length
  const toggle = (id: string) => setCompleted((current) => ({ ...current, [`${workflow.key}:${id}`]: !current[`${workflow.key}:${id}`] }))
  const status = done === workflow.tasks.length ? '已完成' : done ? '进行中' : '待开始'
  const stepItems = workflows.map((item) => ({ title: item.key.toUpperCase(), content: item.title }))
  const activeIndex = workflows.findIndex((item) => item.key === workflow.key)
  const score = useMemo(() => Math.round((totalDone / workflows.reduce((sum, item) => sum + item.tasks.length, 0)) * 100), [totalDone])
  return <div className="workflow-studio">
    <div className="workflow-hero"><div><Text className="view-eyebrow">研究交付工作台</Text><Title level={2}>从采集到交接，前端流程闭环</Title><Text type="secondary">把六个关键工作阶段变成可执行、可验证、可回溯的工作流。</Text></div><div className="workflow-hero-actions"><Tag color={score === 100 ? 'success' : 'processing'}>{score}% 完成</Tag><Button type="primary" onClick={() => setCompleted({})}>重置进度</Button></div></div>
    <Card className="workflow-progress-card"><Steps current={activeIndex} items={stepItems} onChange={(index) => setActive(workflows[index].key)} responsive /></Card>
    <Row gutter={[18, 18]}><Col xs={24} lg={16}><Card className="panel-card workflow-task-card" title={<Space><span>{workflow.key.toUpperCase()}</span><span>{workflow.title}</span><Tag color={status === '已完成' ? 'success' : status === '进行中' ? 'processing' : 'default'}>{status}</Tag></Space>} extra={<Text type="secondary">{done}/{workflow.tasks.length}</Text>}><Text type="secondary">{workflow.subtitle}</Text><Progress percent={Math.round((done / workflow.tasks.length) * 100)} showInfo={false} status={status === '已完成' ? 'success' : 'active'} /><Space orientation="vertical" size={0} className="workflow-task-list">{workflow.tasks.map((task) => <div className={`workflow-task ${completed[`${workflow.key}:${task.id}`] ? 'is-done' : ''}`} key={task.id}><Checkbox checked={!!completed[`${workflow.key}:${task.id}`]} onChange={() => toggle(task.id)}><span>{task.label}{task.required && <Tag color="red">必填</Tag>}</span></Checkbox><Text type="secondary">{task.detail}</Text></div>)}</Space><Divider /><Space><Button type="primary" disabled={requiredMissing} onClick={() => setCompleted((current) => ({ ...current, [`${workflow.key}:published`]: true }))}>确认本阶段</Button>{requiredMissing && <Text type="warning">完成必填项后才能确认</Text>}{!requiredMissing && <Text type="success"><CheckCircleFilled /> 可确认</Text>}</Space></Card></Col><Col xs={24} lg={8}><Card className="panel-card workflow-side-card" title="阶段检查"><Statistic title="本阶段完成度" value={Math.round((done / workflow.tasks.length) * 100)} suffix="%" /><Divider /><Alert type={requiredMissing ? 'warning' : 'success'} showIcon title={requiredMissing ? '还有必填项未完成' : '阶段条件已满足'} description={requiredMissing ? '系统会阻止未完成阶段进入发布状态。' : '可以进入下一步或补充审计记录。'} /><Divider /><Text strong>研究备注</Text><Input.TextArea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} placeholder="记录本阶段的判断、风险与待办" /></Card><Card className="panel-card workflow-side-card" title="交付工具"><Space orientation="vertical" style={{ width: '100%' }}><Select placeholder="选择技术方向" options={['智能配电','区域控制器','功能安全','高压平台'].map((value) => ({ value, label: value }))} /><Upload beforeUpload={() => false} showUploadList={false}><Button block icon={<UploadOutlined />}>上传 Word / PDF</Button></Upload><Button block icon={<FileAddOutlined />}>生成阶段摘要</Button><Button block icon={<SafetyCertificateOutlined />}>查看审计记录</Button></Space></Card></Col></Row>
  </div>
}
