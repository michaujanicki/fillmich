import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sameSourceVersion, sourceVersion } from './registryVersion.js'

const headers = { 'Content-Disposition': 'attachment; filename="Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_20261124_6.0.0.xml"', 'Content-Length': '74363761' }
test('reads the export version from HEAD or download headers', () => {
  const expected = { date: '2026-11-24', size: 74363761 }
  assert.deepEqual(sourceVersion(headers), expected)
  assert.deepEqual(sourceVersion(new Headers(headers)), expected)
  assert.equal(sourceVersion({ 'content-length': '74363761' }), null)
  assert.equal(sourceVersion({ ...headers, 'Content-Length': '0' }), null)
})
test('only skips when both known version markers match', () => {
  const current = sourceVersion(headers)
  assert.equal(sameSourceVersion(current, { ...current }), true)
  assert.equal(sameSourceVersion(current, { ...current, size: current.size + 1 }), false)
  assert.equal(sameSourceVersion(current, { ...current, date: '2026-11-25' }), false)
  assert.equal(sameSourceVersion(null, current), false)
  assert.equal(sameSourceVersion(current, null), false)
})
