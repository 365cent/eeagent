const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const test = require('node:test')
const typescript = require('typescript')

function loadModule() {
  const filename = path.resolve(__dirname, '../lib/ingest-source-url.ts')
  const source = readFileSync(filename, 'utf8')
  const compiled = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  loaded._compile(compiled, filename)
  return loaded.exports
}

const { sourceUrlFromSavedHtml } = loadModule()

test('reads the SingleFile provenance comment', () => {
  const html = `<html lang=en style><!--
 Page saved with SingleFile 
 url: https://www.eet-china.com/mp/a491751.html 
 saved date: Thu Nov 19 2026 16:55:30 GMT+0800 (中国标准时间)
--><meta charset=utf-8><title>北京车展新能源汽车EE架构总结与技术对标-电子工程专辑</title>`
  assert.equal(sourceUrlFromSavedHtml(html), 'https://www.eet-china.com/mp/a491751.html')
})

test('prefers the saved page URL over canonical', () => {
  const html = `<!-- saved with SingleFile url: https://example.com/saved --><link rel=canonical href=https://example.com/canonical>`
  assert.equal(sourceUrlFromSavedHtml(html), 'https://example.com/saved')
})

test('falls back to canonical when the provenance URL is not http(s)', () => {
  const html = `<!-- saved with SingleFile url: about:blank --><link rel=canonical href="https://example.com/page">`
  assert.equal(sourceUrlFromSavedHtml(html), 'https://example.com/page')
})

test('reads unquoted SingleFile attributes', () => {
  const html = `<html lang=en style><link rel=canonical href=https://www.eet-china.com/mp/a491751.html><meta http-equiv=content-security-policy content="default-src 'none'">`
  assert.equal(sourceUrlFromSavedHtml(html), 'https://www.eet-china.com/mp/a491751.html')
})

test('reads quoted canonical, og:url and twitter:url', () => {
  assert.equal(
    sourceUrlFromSavedHtml(`<link rel="canonical" href="https://example.com/can">`),
    'https://example.com/can',
  )
  assert.equal(
    sourceUrlFromSavedHtml(`<meta property=og:url content=https://example.com/og>`),
    'https://example.com/og',
  )
  assert.equal(
    sourceUrlFromSavedHtml(`<meta name="twitter:url" content="https://example.com/t">`),
    'https://example.com/t',
  )
})

test('decodes escaped ampersands', () => {
  assert.equal(
    sourceUrlFromSavedHtml(`<link rel=canonical href="https://example.com/a?x=1&amp;y=2">`),
    'https://example.com/a?x=1&y=2',
  )
})

test('reads legacy saved-from-url comments', () => {
  assert.equal(
    sourceUrlFromSavedHtml(`<!-- saved from url=(0045)https://example.com/legacy --><html></html>`),
    'https://example.com/legacy',
  )
})

test('ignores relative and non-http links', () => {
  assert.equal(sourceUrlFromSavedHtml(`<link rel="canonical" href="/local/path">`), null)
  assert.equal(sourceUrlFromSavedHtml(`<link rel="canonical" href="mailto:a@b.c">`), null)
  assert.equal(sourceUrlFromSavedHtml(`<html><body><p>saved page</p></body></html>`), null)
})

test('accepts a leading BOM', () => {
  const html = '\uFEFF<!DOCTYPE html><html><head><link rel="canonical" href="https://example.com/x"></head></html>'
  assert.equal(sourceUrlFromSavedHtml(html), 'https://example.com/x')
})
