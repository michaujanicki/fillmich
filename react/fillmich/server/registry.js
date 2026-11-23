import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { SaxesParser } from 'saxes'

const SOURCE = 'https://rejestry.ezdrowie.gov.pl/api/rpl/medicinal-products/public-pl-report/6.0.0/overall.xml'
const DAY = 24 * 60 * 60 * 1000
mkdirSync('data', { recursive: true })
const db = new DatabaseSync('data/registry.sqlite')
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, strength TEXT, form TEXT, leaflet TEXT);
CREATE TABLE IF NOT EXISTS packages (product_id TEXT NOT NULL, code TEXT NOT NULL, description TEXT);
CREATE INDEX IF NOT EXISTS packages_code ON packages(code);
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS staging_products (id TEXT PRIMARY KEY, name TEXT NOT NULL, strength TEXT, form TEXT, leaflet TEXT);
CREATE TABLE IF NOT EXISTS staging_packages (product_id TEXT NOT NULL, code TEXT NOT NULL, description TEXT);`)
let running = false
let lastError = ''
const metadata = db.prepare('SELECT value FROM metadata WHERE key = ?')
const getUpdatedAt = () => metadata.get('updated_at')?.value || null
export function status() { return { updatedAt: getUpdatedAt(), importing: running, error: lastError, count: db.prepare('SELECT count(*) AS count FROM products').get().count } }
export function search(query, code) {
  if (code) {
    if (!/^\d{8,14}$/.test(code)) return []
    return db.prepare(`SELECT p.id,p.name,p.strength,p.form,p.leaflet,k.code,k.description FROM packages k JOIN products p ON p.id=k.product_id WHERE k.code=? LIMIT 30`).all(code.padStart(14, '0')).map(({ code: found, description, ...product }) => ({ ...product, package: { code: found, description } }))
  }
  if (query.trim().length < 2) return []
  const escaped = query.trim().replace(/[\\%_]/g, '\\$&')
  return db.prepare("SELECT id,name,strength,form,leaflet FROM products WHERE name LIKE ? ESCAPE '\\' ORDER BY name LIMIT 20").all(`%${escaped}%`)
}
export function packagesForProduct(id) {
  if (!/^\d{1,30}$/.test(id)) return []
  return db.prepare('SELECT DISTINCT code, description FROM packages WHERE product_id = ? ORDER BY description, code').all(id)
}
export async function refresh() {
  if (running) return
  running = true; lastError = ''
  try {
    const response = await fetch(SOURCE, { signal: AbortSignal.timeout(300000) })
    if (!response.ok || !response.body) throw new Error(`Rejestr odpowiedzial kodem ${response.status}`)
    db.exec('DELETE FROM staging_products; DELETE FROM staging_packages;')
    const addProduct = db.prepare('INSERT OR REPLACE INTO staging_products VALUES (?, ?, ?, ?, ?)')
    const addPackage = db.prepare('INSERT INTO staging_packages VALUES (?, ?, ?)')
    let product, pack, date, productCount = 0, records = 0, inTransaction = false
    const parser = new SaxesParser()
    const begin = () => { if (!inTransaction) { db.exec('BEGIN'); inTransaction = true } }
    parser.on('opentag', tag => {
      const a = tag.attributes
      if (tag.name === 'produktyLecznicze') date = a.stanNaDzien || ''
      if (tag.name === 'produktLeczniczy') product = { id: a.id, name: a.nazwaProduktu, strength: a.moc || '', form: a.nazwaPostaciFarmaceutycznej || '', leaflet: a.ulotka || '' }
      if (tag.name === 'opakowanie' && product && a.skasowane !== 'TAK') pack = { code: a.kodGTIN || '', units: [] }
      if (tag.name === 'jednostkaOpakowania' && pack) pack.units.push([a.liczbaOpakowan, a.rodzajOpakowania, a.pojemnosc, a.jednostkaPojemnosci].filter(Boolean).join(' '))
    })
    parser.on('closetag', tag => {
      if (tag.name === 'opakowanie' && pack) { if (product?.id && (/^\d{8,14}$/.test(pack.code) || pack.units.length)) { begin(); addPackage.run(product.id, /^\d{8,14}$/.test(pack.code) ? pack.code.padStart(14, '0') : '', pack.units.join(', ')); records++ } pack = null }
      if (tag.name === 'produktLeczniczy' && product) { if (product.id && product.name) { begin(); addProduct.run(product.id, product.name, product.strength, product.form, product.leaflet); productCount++; records++ } product = null }
      if (records >= 3000 && inTransaction) { db.exec('COMMIT'); inTransaction = false; records = 0 }
    })
    const decoder = new TextDecoder()
    for await (const chunk of response.body) parser.write(decoder.decode(chunk, { stream: true }))
    parser.write(decoder.decode()).close()
    if (inTransaction) { db.exec('COMMIT'); inTransaction = false }
    if (!productCount) throw new Error('Rejestr nie zawiera rozpoznanych produktow')
    db.exec('BEGIN; DELETE FROM packages; DELETE FROM products; INSERT INTO products SELECT * FROM staging_products; INSERT INTO packages SELECT * FROM staging_packages;')
    db.prepare('INSERT OR REPLACE INTO metadata VALUES (?, ?)').run('updated_at', new Date().toISOString())
    db.prepare('INSERT OR REPLACE INTO metadata VALUES (?, ?)').run('registry_date', date || '')
    db.prepare('INSERT OR REPLACE INTO metadata VALUES (?, ?)').run('schema_version', '2')
    db.exec('COMMIT')
    console.log(`RPL: zaimportowano ${productCount} produktow, stan ${date}`)
  } catch (error) {
    try { db.exec('ROLLBACK') } catch { /* no active transaction */ }
    lastError = error.message
    console.error('RPL: aktualizacja nie powiodla sie:', lastError)
  } finally { running = false }
}
export function scheduleRefresh() {
  const updatedAt = getUpdatedAt()
  if (!updatedAt || metadata.get('schema_version')?.value !== '2' || Date.now() - Date.parse(updatedAt) >= DAY) void refresh()
  const timer = setInterval(() => { const updated = getUpdatedAt(); if (!updated || Date.now() - Date.parse(updated) >= DAY) void refresh() }, 60 * 60 * 1000)
  timer.unref()
}
