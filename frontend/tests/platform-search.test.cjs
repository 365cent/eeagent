const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const test = require('node:test')
const typescript = require('typescript')

// Run the pure TypeScript search module with a small navigation fixture, so the
// tests exercise the real MiniSearch index without needing a browser or server.
function loadSearch() {
  const filename = path.resolve(__dirname, '../lib/platform-search-index.ts')
  const source = readFileSync(filename, 'utf8')
  const compiled = typescript.transpileModule(source, {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  loaded.require = (name) => {
    if (name === '@/config/menu') {
      return { flattenMainMenuLeafKeys: () => ['overview'], mainMenuTree: [{ key: 'overview', title: 'Overview' }] }
    }
    if (name === '@/config/utility-pages') return { utilityPages: {} }
    return Module.prototype.require.call(loaded, name)
  }
  loaded._compile(compiled, filename)
  return loaded.exports
}

const { buildPlatformSearchIndex, searchPlatform } = loadSearch()

function data(title) {
  return {
    signals: title ? [{ key: 'signal-1', title, publisher: 'Publisher', stage: 'Stage', status: 'Pending', channel: 'Web', type: 'Type', tags: [] }] : [],
    themes: [],
    demands: [],
    landings: [],
  }
}

test('independent search indexes update data without leaking between instances', () => {
  const first = buildPlatformSearchIndex(data('Spark'))
  const second = buildPlatformSearchIndex(data('Motor'))
  assert.equal(searchPlatform('Spark', first)[0].route.view, 'singal')
  assert.equal(searchPlatform('Spark', second).length, 0)
  assert.equal(searchPlatform('Motor', first).length, 0)
  assert.equal(searchPlatform('Motor', second)[0].route.id, 'signal-1')
  assert.equal(searchPlatform('', second)[0].route.view, 'overview')
})
