import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

test('refresh downloads a changed registry, skips an unchanged one and keeps old data on failure', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'fillmich-registry-'))
  try {
    const script = `
      import assert from 'node:assert/strict'
      const mod = await import(process.argv[1])
      let size = 100, gets = 0, broken = false, headFails = false
      const headers = () => ({ 'content-disposition': 'attachment; filename="Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_20261124_6.0.0.xml"', 'content-length': String(size) })
      globalThis.fetch = async (_url, options = {}) => {
        if (options.method === 'HEAD') { if (headFails) throw new Error('HEAD unsupported'); return new Response(null, { status: 200, headers: headers() }) }
        gets++
        return new Response(broken ? '<bad' : '<produktyLecznicze stanNaDzien="2026-11-24"><produktLeczniczy id="1" nazwaProduktu="Test"/></produktyLecznicze>', { status: 200, headers: headers() })
      }
      await mod.refresh(); assert.equal(gets, 1); assert.equal(mod.status().result, 'updated'); assert.equal(mod.status().count, 1)
      const importedAt = mod.status().updatedAt
      await mod.refresh(); assert.equal(gets, 1); assert.equal(mod.status().result, 'unchanged'); assert.equal(mod.status().updatedAt, importedAt); assert.ok(mod.status().checkedAt)
      size = 101; await mod.refresh(); assert.equal(gets, 2); assert.equal(mod.status().result, 'updated')
      headFails = true; await mod.refresh(); assert.equal(gets, 3); assert.equal(mod.status().result, 'updated')
      size = 102; headFails = false; broken = true; await mod.refresh(); assert.equal(gets, 4); assert.ok(mod.status().error); assert.equal(mod.status().count, 1)
    `
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script, new URL('./registry.js', import.meta.url).href], { cwd: temporary, encoding: 'utf8' })
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  } finally { rmSync(temporary, { recursive: true, force: true }) }
})
