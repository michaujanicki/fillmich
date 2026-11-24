import { test } from 'node:test'
import assert from 'node:assert/strict'
import { downloadSnapshot } from './registryUpdate.js'

const headers = { 'content-disposition': 'attachment; filename="Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_20261124_6.0.0.xml"', 'content-length': '1234' }
const xml = '<produktyLecznicze stanNaDzien="2026-11-24"><produktLeczniczy id="1" nazwaProduktu="Lek"/></produktyLecznicze>'

test('Android check skips download only for a matching version', async () => {
  let downloads = 0, saved = null
  const http = { request: async () => ({ status: 200, headers }), get: async () => { downloads++; return { status: 200, headers, data: xml } } }
  const save = async value => { saved = value }
  const current = { products: [{ id: '1' }], sourceVersion: { date: '2026-11-24', size: 1234 } }
  assert.equal((await downloadSnapshot(current, { http, save })).result, 'unchanged')
  assert.equal(downloads, 0)
  assert.equal(saved, null)
  const update = await downloadSnapshot({ products: current.products }, { http, save })
  assert.equal(update.result, 'updated')
  assert.equal(downloads, 1)
  assert.deepEqual(saved.sourceVersion, current.sourceVersion)
})

test('Android downloads when HEAD does not provide version information', async () => {
  let downloads = 0
  const http = { request: async () => { throw new Error('HEAD unavailable') }, get: async () => { downloads++; return { status: 200, headers, data: xml } } }
  const result = await downloadSnapshot({ products: [{ id: '1' }] }, { http, save: async () => {} })
  assert.equal(result.result, 'updated')
  assert.equal(downloads, 1)
})
