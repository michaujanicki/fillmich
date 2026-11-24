import { DatabaseSync } from 'node:sqlite'
import { existsSync, writeFileSync } from 'node:fs'

if (!existsSync('data/registry.sqlite')) {
  console.error('Brak bazy rejestru. Uruchom npm run dev i zaczekaj na zakończenie importu.')
  process.exit(1)
}
const db = new DatabaseSync('data/registry.sqlite', { readOnly: true })
const products = db.prepare('SELECT id,name,strength,form,leaflet FROM products').all()
if (!products.length) throw new Error('Baza rejestru jest pusta. Zaczekaj na zakończenie importu.')
const packages = db.prepare('SELECT product_id,code,description FROM packages').all()
const updatedAt = db.prepare("SELECT value FROM metadata WHERE key = 'updated_at'").get()?.value || null
const registryDate = db.prepare("SELECT value FROM metadata WHERE key = 'registry_date'").get()?.value || null
const sourceDate = db.prepare("SELECT value FROM metadata WHERE key = 'source_date'").get()?.value
const sourceSize = Number(db.prepare("SELECT value FROM metadata WHERE key = 'source_size'").get()?.value)
const sourceVersion = sourceDate && sourceSize ? { date: sourceDate, size: sourceSize } : null
writeFileSync('public/registry-snapshot.json', JSON.stringify({ updatedAt, registryDate, sourceVersion, products, packages }))
db.close()
console.log(`Przygotowano kopię rejestru: ${products.length} produktów, ${packages.length} opakowań.`)
