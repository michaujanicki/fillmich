import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { createServer as createViteServer } from 'vite'
import { packagesForProduct, scheduleRefresh, search, status } from './registry.js'

const production = process.argv.includes('--production')
const vite = production ? null : await createViteServer({ server: { middlewareMode: true }, appType: 'spa' })
const dist = resolve('dist')
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    if (req.method !== 'GET') { res.writeHead(405); res.end(JSON.stringify({ error: 'Method not allowed' })); return }
    if (url.pathname === '/api/registry/status') { res.end(JSON.stringify(status())); return }
    if (url.pathname === '/api/registry/packages') { res.end(JSON.stringify(packagesForProduct(url.searchParams.get('productId') || ''))); return }
    if (url.pathname === '/api/registry/search') { res.end(JSON.stringify(search((url.searchParams.get('q') || '').slice(0, 100), url.searchParams.get('code') || ''))); return }
    res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); return
  }
  if (vite) { vite.middlewares(req, res); return }
  try {
    const path = resolve(dist, '.' + decodeURIComponent(url.pathname))
    if (path !== dist && !path.startsWith(dist + sep)) throw new Error('Invalid path')
    let file = path === dist ? resolve(dist, 'index.html') : path
    let contents
    try { contents = await readFile(file) } catch { if (extname(file)) throw new Error('Not found'); file = resolve(dist, 'index.html'); contents = await readFile(file) }
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream'); res.end(contents)
  } catch { res.writeHead(404); res.end('Not found') }
})
server.listen(Number(process.env.PORT || 5173), 'localhost', () => console.log(`Fillmich: http://localhost:${process.env.PORT || 5173}`))
scheduleRefresh()
