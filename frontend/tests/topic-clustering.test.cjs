const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const test = require('node:test')
const typescript = require('typescript')

function loadTypescript(relative) {
  const filename = path.resolve(__dirname, relative)
  const source = readFileSync(filename, 'utf8')
  const compiled = typescript.transpileModule(source, {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  loaded._compile(compiled, filename)
  return loaded.exports
}

const { cleanSignalTitle, clusterQualifiesForTopic, isReliableTopicEvidence, topicCreationGate } =
  loadTypescript('../lib/topic-clustering.ts')

function signal(overrides) {
  return {
    id: overrides.id || 'id-' + Math.random(),
    title: overrides.title,
    url: overrides.url,
    url_normalized: overrides.url_normalized || overrides.url || null,
    document_id: overrides.document_id || null,
    evidence_status_code: 'retained',
    channel_code: 'web',
    publisher: null,
    updated_at: '2026-11-20T00:00:00Z',
  }
}

test('keeps hyphens that belong to the title', () => {
  assert.equal(cleanSignalTitle('MIPI A-PHY v2.0发布：汽车高速连接'), 'MIPI A-PHY v2.0发布：汽车高速连接')
  assert.equal(cleanSignalTitle('48V-12V 转换器'), '48V-12V 转换器')
})

test('strips a site suffix when the stem still identifies the article', () => {
  assert.equal(cleanSignalTitle('蔚来ET9的数字架构有什么特别之处 - EDN 电子技术设计'), '蔚来ET9的数字架构有什么特别之处')
  assert.equal(
    cleanSignalTitle('汽车智能座舱团体标准体系研究报告｜某网'),
    '汽车智能座舱团体标准体系研究报告',
  )
})

test('keeps the whole title when cutting would leave too little', () => {
  const full = '附下载| 汽车智能座舱团体标准体系研究报告'
  assert.equal(cleanSignalTitle(full), full)
})

test('a hyphenated technical title still counts as reliable evidence', () => {
  const s = signal({
    title: 'MIPI A-PHY v2.0发布：汽车高速连接新纪元',
    url: 'https://baijiahao.baidu.com/s?id=1',
  })
  assert.equal(isReliableTopicEvidence(s), true)
})

test('two signals from two hosts qualify a topic', () => {
  const cluster = {
    label: 'A · B',
    sharedTags: ['TSN'],
    signals: [
      signal({ title: '车载TSN技术与确定性网络', url: 'https://a.example/x' }),
      signal({ title: '时间敏感网络TSN工程实践', url: 'https://b.example/y' }),
    ],
  }
  assert.deepEqual(clusterQualifiesForTopic(cluster), { ok: true, reason: '' })
})

test('a single reliable signal may create a provisional topic', () => {
  const cluster = {
    label: 'CCC',
    sharedTags: ['CCC'],
    signals: [
      signal({
        title: 'Mobility and Automotive Technology deep dive article',
        url: 'https://a.example/x',
      }),
    ],
  }
  const creation = topicCreationGate(cluster)
  assert.equal(creation.tier, 'provisional')
  assert.equal(creation.canCreate, true)
  assert.equal(clusterQualifiesForTopic(cluster).ok, false)
})

test('a single-source family stays blocked', () => {
  const cluster = {
    label: 'A · B',
    sharedTags: [],
    signals: [
      signal({ title: '车载TSN技术与确定性网络', url: 'https://a.example/x' }),
      signal({ title: '另一篇TSN技术文章说明', url: 'https://a.example/z' }),
    ],
  }
  const gate = clusterQualifiesForTopic(cluster)
  assert.equal(gate.ok, false)
  const creation = topicCreationGate(cluster)
  assert.equal(creation.tier, 'provisional')
  assert.equal(creation.canCreate, true)
  assert.match(creation.reason, /来源/)
})
