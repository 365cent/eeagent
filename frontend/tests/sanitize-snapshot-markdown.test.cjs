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

const { sanitizeSnapshotMarkdown } = loadTypescript('../lib/evidence/sanitize-snapshot-markdown.ts')
const {
  sanitizeMarkdownUrl,
  sanitizeMarkdownUrlsInText,
} = loadTypescript('../lib/evidence/sanitize-markdown-url.ts')

test('unwraps single-cell article table from markitdown', () => {
  const article = 'SOA的前世今生 2022-08-01 作者：谢彬 ' + '正文'.repeat(200)
  const input = `| ${article} |`
  const out = sanitizeSnapshotMarkdown(input)
  assert.ok(!out.trim().startsWith('|'), out.slice(0, 40))
  assert.ok(out.includes('SOA的前世今生'))
})

test('unwraps single-column line-by-line faux table', () => {
  const input = ['| 标题行 |', '| 第二段内容 |', '| 第三段内容 |'].join('\n')
  const out = sanitizeSnapshotMarkdown(input)
  assert.equal(out, '标题行\n\n第二段内容\n\n第三段内容')
})

test('keeps real multi-column tables', () => {
  const input = ['| 日期 | 工时 |', '| --- | --- |', '| 04-01 | 3 |', '| 04-02 | 4 |'].join('\n')
  const out = sanitizeSnapshotMarkdown(input)
  assert.equal(out, input)
})

test('strips chinese prose glued after feishu autolink', () => {
  const broken =
    'https://yesv-desaysv.feishu.cn/docx/RlzKdMvryo2efYxAF63cvi7knrc?from=from_copylink；结合公司'
  const safe = sanitizeMarkdownUrl(broken)
  assert.equal(safe, 'https://yesv-desaysv.feishu.cn/docx/RlzKdMvryo2efYxAF63cvi7knrc?from=from_copylink')
})

test('strips percent-encoded fullwidth semicolon in href', () => {
  const broken =
    'https://yesv-desaysv.feishu.cn/docx/NOotdSkjbotMbDxeqXKcG9clnQc?from=from_copylink%EF%BC%9B%E6%80%BB%E7%BB%93'
  const safe = sanitizeMarkdownUrl(broken)
  assert.equal(safe, 'https://yesv-desaysv.feishu.cn/docx/NOotdSkjbotMbDxeqXKcG9clnQc?from=from_copylink')
})

test('sanitizeMarkdownUrlsInText fixes table cell text', () => {
  const row = '| 链接 | https://example.com/a?x=1；说明文字 |'
  const out = sanitizeMarkdownUrlsInText(row)
  assert.ok(out.includes('https://example.com/a?x=1'))
  assert.ok(!out.includes('说明文字'))
})