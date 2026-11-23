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

const {
  sanitizeSnapshotMarkdown,
  isFailedFigureCaption,
} = loadTypescript('../lib/evidence/sanitize-snapshot-markdown.ts')
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
  assert.ok(out.includes('标题行'))
  assert.ok(out.includes('第二段内容'))
  assert.ok(out.includes('第三段内容'))
  assert.ok(!/^\|/.test(out))
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

test('normalizes ad-linked figure placeholders to blockquotes', () => {
  const input = '[ 图 1：（视觉模型未返回描述） ](http://www.example.com/ad) | --- --- --- | 图 2：（视觉模型未返回描述）'
  const out = sanitizeSnapshotMarkdown(input)
  assert.ok(out.includes('> 图 1：（视觉模型未返回描述）'))
  assert.ok(out.includes('> 图 2：（视觉模型未返回描述）'))
  assert.ok(!out.includes('--- --- ---'))
})

test('fixes orphan markdown link closers', () => {
  const input = '学习助手](http://123.114.210.122:5000/)'
  const out = sanitizeSnapshotMarkdown(input)
  assert.ok(out.includes('[学习助手](http://123.114.210.122:5000/)'))
})

test('isFailedFigureCaption detects placeholder', () => {
  assert.equal(isFailedFigureCaption('图 3：（视觉模型未返回描述）'), true)
  assert.equal(isFailedFigureCaption('图 17：（待视觉描述）'), true)
  assert.equal(isFailedFigureCaption('导出架构示意图'), false)
})

test('unwraps portal sidebar pipe tables around article prose', () => {
  const input = [
    '基于 AUTOSAR 的自动驾驶软件架构',
    '| --- | --- | --- | | | | | | --- | --- | | 您可以捐助 | | |',
    '| --- | | [ [',
    '',
    '图 1：（视觉模型未返回描述）',
    '](http://www.uml.org.cn/inc/adpf.asp) |',
    '| --- | --- | --- | --- | --- | 求知 | 文章 | 文库 | | --- | --- |',
    '本文主要介绍了基于 AUTOSAR 的自动驾驶软件架构相关知识。',
  ].join('\n')
  const out = sanitizeSnapshotMarkdown(input)
  assert.ok(out.includes('基于 AUTOSAR 的自动驾驶软件架构'))
  assert.ok(out.includes('> 图 1：（视觉模型未返回描述）'))
  assert.ok(out.includes('本文主要介绍了基于 AUTOSAR'))
  assert.ok(!out.match(/\|\s*---\s*\|\s*---/))
})

test('drops pipe-only lines and unwraps empty grid tables', () => {
  const input = [
    '| | | | |',
    '| --- | --- | --- |',
    '| | | | |',
    '57 次 || 2023-9-26 ||',
    '|',
    '|',
    '> |',
    '> 图 4：（视觉模型未返回描述）',
  ].join('\n')
  const out = sanitizeSnapshotMarkdown(input)
  assert.ok(!out.includes('\n|\n'))
  assert.ok(out.includes('57 次 · 2023-9-26'))
  assert.ok(out.includes('> 图 4：（视觉模型未返回描述）'))
})

test('sanitizeMarkdownUrlsInText fixes table cell text', () => {
  const row = '| 链接 | https://example.com/a?x=1；说明文字 |'
  const out = sanitizeMarkdownUrlsInText(row)
  assert.ok(out.includes('https://example.com/a?x=1'))
  assert.ok(!out.includes('说明文字'))
})

test('lifts a linked blockquote figure out of its table cell', () => {
  const input = [
    '|  |',
    '| --- |',
    '| [',
    '',
    '> \u56fe 1\uff1a\u4e00\u5f20\u6f14\u793a\u9875\u9762',
    '',
    '](http://www.uml.org.cn/inc/adpf.asp) |',
  ].join('\n')
  const out = sanitizeSnapshotMarkdown(input)
  assert.ok(out.includes('> \u56fe 1\uff1a\u4e00\u5f20\u6f14\u793a\u9875\u9762'), out)
  assert.ok(!out.includes('adpf.asp'), out)
  assert.ok(!out.includes('[>'), out)
})
