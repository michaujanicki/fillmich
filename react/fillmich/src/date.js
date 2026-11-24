export const formatDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').reverse().join('.') : value
export const localDate = (date = new Date()) => date.toLocaleDateString('en-CA')
export const formatDateLong = value => new Date(`${value}T12:00:00`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
export const formatDateFull = value => new Date(`${value}T12:00:00`).toLocaleDateString('pl-PL', { dateStyle: 'full' })
export const formatMonth = date => date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
