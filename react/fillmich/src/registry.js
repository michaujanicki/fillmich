import { Capacitor } from '@capacitor/core'
const getJson = async url => {
  const response = await fetch(url)
  if (!response.ok) { const error = new Error(`Registry request failed (${response.status})`); error.status = response.status; throw error }
  return response.json()
}
let snapshotPromise
function snapshot() {
  if (!snapshotPromise) snapshotPromise = getJson('./registry-snapshot.json').then(data => {
    const byId = new Map(data.products.map(product => [product.id, product]))
    const byProduct = new Map(), byCode = new Map()
    for (const item of data.packages) {
      const pack = { code: item.code, description: item.description }
      if (!byProduct.has(item.product_id)) byProduct.set(item.product_id, [])
      byProduct.get(item.product_id).push(pack)
      if (item.code && byId.has(item.product_id)) {
        if (!byCode.has(item.code)) byCode.set(item.code, [])
        byCode.get(item.code).push({ ...byId.get(item.product_id), package: pack })
      }
    }
    return { ...data, byProduct, byCode }
  }).catch(error => { snapshotPromise = null; throw error })
  return snapshotPromise
}
export async function registryStatus() {
  if (!Capacitor.isNativePlatform()) return getJson('/api/registry/status')
  const data = await snapshot()
  return { count: data.products.length, updatedAt: data.updatedAt, importing: false }
}
export async function searchRegistry(query) {
  if (!Capacitor.isNativePlatform()) return getJson(`/api/registry/search?q=${encodeURIComponent(query)}`)
  const term = query.trim().toLocaleLowerCase('pl')
  if (term.length < 2) return []
  const data = await snapshot()
  return data.products.filter(product => product.name.toLocaleLowerCase('pl').includes(term)).slice(0, 20)
}
export async function findByCode(code) {
  if (!/^\d{8,14}$/.test(code)) return []
  if (!Capacitor.isNativePlatform()) return getJson(`/api/registry/search?code=${encodeURIComponent(code)}`)
  const data = await snapshot()
  return (data.byCode.get(code.padStart(14, '0')) || []).slice(0, 30)
}
export async function getPackages(id) {
  if (!Capacitor.isNativePlatform()) return getJson(`/api/registry/packages?productId=${encodeURIComponent(id)}`)
  const data = await snapshot()
  return [...new Map((data.byProduct.get(id) || []).map(pack => [`${pack.code}|${pack.description}`, pack])).values()]
}
