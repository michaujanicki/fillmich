import { CapacitorHttp } from '@capacitor/core'
import { SaxesParser } from 'saxes'
import { REGISTRY_SOURCE, sameSourceVersion, sourceVersion } from './registryVersion.js'

const DB = 'fillmich-registry'

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('snapshot')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function readSavedSnapshot() {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('snapshot').objectStore('snapshot').get('current')
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}

async function saveSnapshot(data) {
  const db = await database()
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('snapshot', 'readwrite')
      transaction.objectStore('snapshot').put(data, 'current')
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error || new Error('Zapis bazy przerwany'))
    })
  } finally { db.close() }
}

export function parseRegistry(xml) {
  const products = [], packages = []
  let product, pack, registryDate = ''
  const parser = new SaxesParser()
  parser.on('opentag', tag => {
    const a = tag.attributes
    if (tag.name === 'produktyLecznicze') registryDate = a.stanNaDzien || ''
    if (tag.name === 'produktLeczniczy') product = { id: a.id, name: a.nazwaProduktu, strength: a.moc || '', form: a.nazwaPostaciFarmaceutycznej || '', leaflet: a.ulotka || '' }
    if (tag.name === 'opakowanie' && product && a.skasowane !== 'TAK') pack = { code: a.kodGTIN || '', units: [] }
    if (tag.name === 'jednostkaOpakowania' && pack) pack.units.push([a.liczbaOpakowan, a.rodzajOpakowania, a.pojemnosc, a.jednostkaPojemnosci].filter(Boolean).join(' '))
  })
  parser.on('closetag', tag => {
    if (tag.name === 'opakowanie' && pack) {
      if (product?.id && (/^\d{8,14}$/.test(pack.code) || pack.units.length)) packages.push({ product_id: product.id, code: /^\d{8,14}$/.test(pack.code) ? pack.code.padStart(14, '0') : '', description: pack.units.join(', ') })
      pack = null
    }
    if (tag.name === 'produktLeczniczy' && product) { if (product.id && product.name) products.push(product); product = null }
  })
  parser.write(xml).close()
  if (!products.length) throw new Error('Nie rozpoznano produktów w rejestrze')
  return { products, packages, registryDate, updatedAt: new Date().toISOString() }
}

export async function downloadSnapshot(current, { http = CapacitorHttp, save = saveSnapshot } = {}) {
  let available = null
  try {
    const head = await http.request({ url: REGISTRY_SOURCE, method: 'HEAD', connectTimeout: 30000, readTimeout: 30000 })
    if (head.status === 200) available = sourceVersion(head.headers)
  } catch { /* Fall back to a full download when a version check is unavailable. */ }
  if (current?.products?.length && sameSourceVersion(current.sourceVersion, available)) return { result: 'unchanged', data: null }
  const response = await http.get({ url: REGISTRY_SOURCE, responseType: 'text', connectTimeout: 30000, readTimeout: 300000 })
  if (response.status !== 200 || typeof response.data !== 'string') throw new Error('Nie udało się pobrać rejestru')
  const data = parseRegistry(response.data)
  const downloaded = sourceVersion(response.headers)
  if (downloaded && downloaded.date === data.registryDate) data.sourceVersion = downloaded
  await save(data)
  return { result: 'updated', data }
}
