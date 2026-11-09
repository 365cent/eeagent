import fs from 'node:fs'

const path = 'app/dashboard.css'
let s = fs.readFileSync(path, 'utf8')

s = s.replace(
  /@media \(max-width: 760px\) \{\s*\.app-shell > \.app-sider[\s\S]*?\.trace-flow > \.anticon \{ display:none; \}\s*\}/,
  '',
)

s = s.replace(
  /\.dark-mode \.app-sider[\s\S]*?\.dark-mode \.main-menu \.ant-menu-item:hover \{[^}]+\}/,
  '',
)

s = s.replace(
  /\.app-shell\.layout-pending \.app-sider, \.app-shell\.layout-pending > \.app-sider \+ \.ant-layout, \.app-shell\.layout-pending \.ant-layout-sider-children/,
  '.app-shell.layout-pending .ant-pro-sider, .app-shell.layout-pending .ant-pro-layout-container',
)

s = s.replace(/^\* \{ box-sizing: border-box; \}\r?\n/, '')
s = s.replace(
  /^html, body \{ margin: 0;[\s\S]*?\.dark-mode \.avatar \{[^}]+\}\r?\n/,
  '',
)
s = s.replace(/^body \{ font-family:[^}]+\}\r?\n/, '')
s = s.replace(/^\.ant-app \{ font-family:[^}]+\}\r?\n/, '')
s = s.replace(/^\.dashboard-content \{[\s\S]*?\.dark-mode \.dashboard-content \{[^}]+\}\r?\n/, '')
s = s.replace(/\\n/g, '\n')
s = s.replace(/\.panel-card \{ min-width:0; \}\n/, '')

const m1100 = [...s.matchAll(/@media \(max-width: 1100px\) \{[\s\S]*?\}\n/g)]
if (m1100.length > 1) {
  s = s.replace(m1100[0][0], '')
}

fs.writeFileSync(path, s)
console.log('dashboard.css bytes:', Buffer.byteLength(s))
