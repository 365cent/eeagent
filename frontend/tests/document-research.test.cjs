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

function loadModule() {
  const filename = path.resolve(__dirname, '../lib/document-research.ts')
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

const {
  buildDocumentResearchSearch,
  buildDocumentSectionTree,
  citationLabel,
  formatSectionPath,
  joinChunkMarkdown,
  parseDocumentCitationRef,
  parseDocumentResearchFocus,
} = loadModule()

const chunks = [
  { chunk_id: 1, section_path: ['总览'], figure_indices: [1], text: 'A', heading_level: 1, char_start: 0, char_end: 1, content_sha256: 'a' },
  { chunk_id: 2, section_path: ['总览', '结构'], figure_indices: [2], text: 'B', heading_level: 2, char_start: 2, char_end: 3, content_sha256: 'b' },
  { chunk_id: 3, section_path: ['总览', '结构'], figure_indices: [], text: 'C', heading_level: 2, char_start: 4, char_end: 5, content_sha256: 'c' },
  { chunk_id: 4, section_path: null, figure_indices: [], text: 'D', heading_level: null, char_start: 6, char_end: 7, content_sha256: 'd' },
]

test('builds nested section tree and figure locations', () => {
  const tree = buildDocumentSectionTree(chunks)
  assert.deepEqual(tree.roots.map((node) => node.title), ['总览', '正文'])
  const overview = tree.roots[0]
  assert.equal(overview.children.length, 1)
  assert.equal(overview.children[0].title, '结构')
  assert.deepEqual(overview.children[0].chunkIds, [2, 3])
  assert.deepEqual(overview.figureIndices, [1])
  assert.deepEqual(overview.children[0].figureIndices, [2])
  assert.equal(tree.chunkToSection.get(2), overview.children[0].key)
  assert.equal(tree.figureToSection.get(2), overview.children[0].key)
})

test('parses document citations and research focus', () => {
  const documentId = '123e4567-e89b-12d3-a456-426614174000'
  assert.deepEqual(parseDocumentCitationRef('doc:' + documentId + ':4'), {
    kind: 'chunk',
    documentId,
    chunkId: 4,
  })
  assert.deepEqual(parseDocumentCitationRef('fig:' + documentId + ':7'), {
    kind: 'figure',
    documentId,
    figureIndex: 7,
  })
  assert.equal(parseDocumentCitationRef('sig:abc'), null)
  assert.deepEqual(parseDocumentResearchFocus('?doc_chunk=2&doc_figure=3'), {
    chunkId: 2,
    figureIndex: 3,
  })
  assert.deepEqual(parseDocumentResearchFocus('?foo=bar'), {})
  assert.equal(citationLabel('doc:' + documentId + ':4'), '章节 4')
  assert.equal(citationLabel('fig:' + documentId + ':7'), '图块 7')
})

test('preserves unrelated query parameters when writing focus', () => {
  const search = buildDocumentResearchSearch('?keyword=abc&doc_chunk=1', {
    chunkId: 2,
    figureIndex: 3,
  })
  const params = new URLSearchParams(search)
  assert.equal(params.get('keyword'), 'abc')
  assert.equal(params.get('doc_chunk'), '2')
  assert.equal(params.get('doc_figure'), '3')
  assert.equal(formatSectionPath(null), '正文')
  assert.equal(formatSectionPath(['总览', '结构']), '总览 / 结构')
})

test('joins split-table chunks without breaking GFM rows', () => {
  const joined = joinChunkMarkdown([
    '### 2026-04\n\n| 日期 | 工时 |\n|---|---|\n| 04-01 | 3 |',
    '| 04-02 | 4 |',
    '| 04-03 | 5 |',
  ])
  assert.equal(
    joined,
    '### 2026-04\n\n| 日期 | 工时 |\n|---|---|\n| 04-01 | 3 |\n| 04-02 | 4 |\n| 04-03 | 5 |',
  )
})

test('keeps paragraph spacing between prose chunks and drops empties', () => {
  assert.equal(joinChunkMarkdown(['段落一', '段落二', '   ']), '段落一\n\n段落二')
  assert.equal(joinChunkMarkdown([]), '')
})

test('buildAppPath keeps doc_figure in the evidence deep link', () => {
  const build = loadTypescript('../lib/navigation.ts')
  const url = build.buildAppPath({
    view: 'singal',
    id: 'e6f17e9e-e5fe-43bd-ad64-a43203672c3c',
    query: { doc_figure: '1' },
  })
  assert.equal(url, '/singal/e6f17e9e-e5fe-43bd-ad64-a43203672c3c?doc_figure=1')
  assert.deepEqual(parseDocumentResearchFocus(new URL('http://x' + url).search), { figureIndex: 1 })
})
