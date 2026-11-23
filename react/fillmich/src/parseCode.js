export function parseCode(input) {
  const raw = input.replace(/^\]d2/, '')
  if (/^\d{8,14}$/.test(raw)) return { code: raw }
  const fields = {}
  if (raw.includes('(')) {
    for (const match of raw.matchAll(/\((01|17|10|21)\)([^()\x1d]+)/g)) fields[match[1]] = match[2]
  } else {
    let rest = raw
    while (rest) {
      rest = rest.replace(/^\x1d+/, '')
      const ai = rest.slice(0, 2); rest = rest.slice(2)
      if (ai === '01' || ai === '17') { const length = ai === '01' ? 14 : 6; fields[ai] = rest.slice(0, length); rest = rest.slice(length) }
      else if (ai === '10' || ai === '21') { const end = rest.indexOf('\x1d'); fields[ai] = end < 0 ? rest : rest.slice(0, end); rest = end < 0 ? '' : rest.slice(end + 1) }
      else break
    }
  }
  const result = {}
  if (/^\d{14}$/.test(fields['01'] || '')) result.code = fields['01']
  if (fields['10']) result.batch = fields['10']
  const d = fields['17']
  if (/^\d{6}$/.test(d || '')) {
    const year = 2000 + Number(d.slice(0, 2)), month = Number(d.slice(2, 4)), day = Number(d.slice(4, 6))
    const last = new Date(year, month, 0).getDate()
    if (month >= 1 && month <= 12 && day <= last) result.expiry = `${year}-${String(month).padStart(2, '0')}-${String(day || last).padStart(2, '0')}`
  }
  return result
}
