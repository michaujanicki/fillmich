import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dateFromParts, daysInMonth, updateDateParts } from './dateParts.js'

test('dates are saved only when all three fields are selected', () => {
  assert.equal(dateFromParts({ year: '2026', month: '02', day: '' }), '')
  assert.equal(dateFromParts({ year: '2026', month: '02', day: '03' }), '2026-02-03')
})

test('changing month or year clears a day that no longer exists', () => {
  assert.equal(daysInMonth('2024', '02'), 29)
  assert.equal(daysInMonth('2025', '02'), 28)
  assert.equal(updateDateParts({ year: '2024', month: '02', day: '29' }, 'year', '2025').day, '')
  assert.equal(updateDateParts({ year: '2026', month: '01', day: '31' }, 'month', '04').day, '')
})
