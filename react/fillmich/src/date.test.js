import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDate, formatDateLong, localDate } from './date.js'

test('formats stored dates consistently without a time-zone shift', () => {
  assert.equal(formatDate('2024-02-29'), '29.02.2024')
  assert.equal(formatDateLong('2024-02-29'), '29 lutego 2024')
  assert.equal(localDate(new Date(2024, 1, 29, 12)), '2024-02-29')
  assert.equal(formatDate(''), '')
})
