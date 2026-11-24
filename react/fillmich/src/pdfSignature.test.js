import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasPdfHeader } from './pdfSignature.js'

const encode = value => new TextEncoder().encode(value)
test('accepts PDF headers at the beginning and after metadata', () => {
  assert.equal(hasPdfHeader(encode('%PDF-1.6')), true)
  assert.equal(hasPdfHeader(encode(`${'x'.repeat(455)}%PDF-1.6`)), true)
  assert.equal(hasPdfHeader(encode(`${'x'.repeat(1019)}%PDF-`)), true)
})
test('rejects missing headers and headers beyond the first 1024 bytes', () => {
  assert.equal(hasPdfHeader(encode('<html>error</html>')), false)
  assert.equal(hasPdfHeader(encode(`${'x'.repeat(1020)}%PDF-`)), false)
})
