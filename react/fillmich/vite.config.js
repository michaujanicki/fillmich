import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { createReadStream, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pdfRoot = dirname(require.resolve('pdfjs-dist/package.json'))
const pdfFolders = ['cmaps', 'standard_fonts', 'wasm']
function pdfResources() {
  return {
    name: 'pdf-resources',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = /^\/pdfjs\/(cmaps|standard_fonts|wasm)\/([a-zA-Z0-9_.-]+)$/.exec((req.url || '').split('?')[0])
        if (!match) return next()
        const stream = createReadStream(join(pdfRoot, match[1], match[2]))
        stream.on('error', () => { if (!res.headersSent) { res.statusCode = 404; res.end() } else res.destroy() })
        res.setHeader('Content-Type', match[2].endsWith('.wasm') ? 'application/wasm' : match[2].endsWith('.js') ? 'text/javascript; charset=utf-8' : 'application/octet-stream')
        stream.pipe(res)
      })
    },
    generateBundle() {
      for (const folder of pdfFolders) for (const file of readdirSync(join(pdfRoot, folder))) {
        this.emitFile({ type: 'asset', fileName: `pdfjs/${folder}/${file}`, source: readFileSync(join(pdfRoot, folder, file)) })
      }
    },
  }
}
export default defineConfig({ plugins: [react(), pdfResources()] })
