#!/usr/bin/env node
// Simple px -> rem batch converter for .vue/.css files in src/
// WARNING: This script modifies files in place. Commit or backup before running.

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')
const BASE = 16 // base px per rem

function walk(dir, cb) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(d => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) walk(p, cb)
    else if (/\.vue$|\.css$|\.scss$/.test(d.name)) cb(p)
  })
}

function pxToRemMatch(_, num) {
  const px = parseFloat(num)
  const rem = +(px / BASE).toFixed(4)
  return rem === 0 ? '0' : rem + 'rem'
}

console.log('Scanning', SRC)
walk(SRC, file => {
  let text = fs.readFileSync(file, 'utf8')
  const before = text
  // Replace occurrences like "12px" but avoid URLs and data-uris
  text = text.replace(/(\d+(?:\.\d+)?)px/g, pxToRemMatch)
  if (text !== before) {
    fs.writeFileSync(file, text, 'utf8')
    console.log('Updated', path.relative(ROOT, file))
  }
})

console.log('Done. Commit and review changes.')
