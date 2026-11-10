import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const workerSrc = join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
const publicDir = join(root, 'public')
const workerDest = join(publicDir, 'pdf.worker.min.mjs')

if (!existsSync(workerSrc)) {
  console.warn('[copy-pdf-worker] pdfjs-dist worker not found; skip')
  process.exit(0)
}

mkdirSync(publicDir, { recursive: true })
copyFileSync(workerSrc, workerDest)
console.log('[copy-pdf-worker] copied pdf.worker.min.mjs to public/')
