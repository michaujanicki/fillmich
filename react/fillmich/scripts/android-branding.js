import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const source = readFileSync('src/assets/filmich-icon.svg', 'utf8')
const artwork = source.replace(/^\s*<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')
const render = (size, foreground) => {
  // The source already includes the safe area for adaptive Android icons.
  const viewBox = foreground ? '0 0 108 108' : '12 12 84 84'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${artwork}</svg>`
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
}
for (const [density, scale] of Object.entries({ mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 })) {
  const folder = `android/app/src/main/res/mipmap-${density}`
  writeFileSync(`${folder}/ic_launcher_foreground.png`, render(Math.round(108 * scale), true))
  for (const name of ['ic_launcher', 'ic_launcher_round']) writeFileSync(`${folder}/${name}.png`, render(Math.round(48 * scale), false))
}
writeFileSync('android/app/src/main/res/drawable/fillmich_splash.png', render(432, true))
console.log('Przygotowano ikony Androida z grafiki Fillmich.')
