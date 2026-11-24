// Some registry files contain metadata before the PDF header.
export function hasPdfHeader(bytes) {
  const signature = [0x25, 0x50, 0x44, 0x46, 0x2d]
  const lastStart = Math.min(1024, bytes.length) - signature.length
  for (let offset = 0; offset <= lastStart; offset++) {
    if (signature.every((value, index) => bytes[offset + index] === value)) return true
  }
  return false
}
