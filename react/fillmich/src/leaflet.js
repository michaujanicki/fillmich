import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { hasPdfHeader } from './pdfSignature'

const leafletPattern = /^https:\/\/rejestry\.ezdrowie\.gov\.pl\/api\/rpl\/medicinal-products\/\d+\/leaflet$/
const maxBytes = 20 * 1024 * 1024

export async function fetchLeaflet(productId, leafletUrl, signal) {
  if (!/^\d{1,30}$/.test(productId || '') || !leafletPattern.test(leafletUrl || '')) throw new Error('Nieprawidłowy adres ulotki.')
  let bytes
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({ url: leafletUrl, responseType: 'arraybuffer', connectTimeout: 30000, readTimeout: 60000, disableRedirects: true })
    if (response.status !== 200 || typeof response.data !== 'string') throw new Error('Nie udało się pobrać ulotki.')
    if (response.data.length > Math.ceil(maxBytes / 3) * 4 + 65536) throw new Error('Ulotka jest zbyt duża.')
    const binary = atob(response.data)
    bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
  } else {
    const response = await fetch(`/api/registry/leaflet?id=${encodeURIComponent(productId)}`, { signal })
    if (!response.ok) throw new Error('Nie udało się pobrać ulotki.')
    bytes = new Uint8Array(await response.arrayBuffer())
  }
  if (bytes.length > maxBytes || !hasPdfHeader(bytes)) throw new Error('Nieprawidłowy plik ulotki.')
  return bytes
}
