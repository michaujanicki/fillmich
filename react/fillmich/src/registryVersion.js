export const REGISTRY_SOURCE = 'https://rejestry.ezdrowie.gov.pl/api/rpl/medicinal-products/public-pl-report/6.0.0/overall.xml'

function header(headers, name) {
  if (typeof headers?.get === 'function') return headers.get(name)
  const entry = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === name)
  return entry?.[1] ?? null
}

export function sourceVersion(headers) {
  const filename = header(headers, 'content-disposition') || ''
  const date = /stan_na_dzien_(\d{4})(\d{2})(\d{2})_6\.0\.0\.xml/i.exec(filename)
  const rawSize = String(header(headers, 'content-length') || '')
  if (!date || !/^\d+$/.test(rawSize) || !Number.isSafeInteger(Number(rawSize)) || Number(rawSize) <= 0) return null
  return { date: `${date[1]}-${date[2]}-${date[3]}`, size: Number(rawSize) }
}

export function sameSourceVersion(current, available) {
  return Boolean(current && available && current.date === available.date && current.size === available.size)
}
