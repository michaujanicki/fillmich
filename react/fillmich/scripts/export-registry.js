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
writeFileSync('public/registry-snapshot.json', JSON.stringify({ updatedAt, products, packages }))
db.close()
console.log(`Przygotowano kopię rejestru: ${products.length} produktów, ${packages.length} opakowań.`)
