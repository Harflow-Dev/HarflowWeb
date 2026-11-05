#!/usr/bin/env node
/**
 * Architecture dependency and size checks for the exploratory slice.
 * A green run does not prove semantic architecture correctness.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = join(root, 'src')

const MAX_FILE = 400
const WARN_FILE = 250
const MAX_FN = 80
const WARN_FN = 50

const layers = {
  model: { mayImport: [] },
  application: { mayImport: ['model'] },
  presentation: { mayImport: ['application', 'model'] },
  components: { mayImport: ['model', 'presentation'] },
  features: { mayImport: ['presentation', 'components', 'application', 'model'] },
  'adapters/mock': { mayImport: ['application', 'model'] },
  composition: { mayImport: ['*'] },
}

const forbiddenInPure = [
  /\bfetch\s*\(/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bindexedDB\b/,
  /\bXMLHttpRequest\b/,
  /\bprocess\.env\b/,
  /\bfrom ['"]react['"]/,
  /\bfrom ['"]react-dom/,
]

const errors = []
const warnings = []

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const st = statSync(path)
    if (st.isDirectory()) walk(path, out)
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.test.tsx')) {
      out.push(path)
    }
  }
  return out
}

function layerOf(file) {
  const rel = relative(srcRoot, file).replaceAll('\\', '/')
  if (rel.startsWith('adapters/mock/')) return 'adapters/mock'
  const top = rel.split('/')[0]
  if (top in layers) return top
  return null
}

function substantiveLines(text) {
  return text.split('\n').filter((line) => {
    const t = line.trim()
    return t && !t.startsWith('//') && !t.startsWith('*') && t !== '/*' && t !== '*/'
  }).length
}

function importTargets(text) {
  const re = /from\s+['"]([^'"]+)['"]/g
  const out = []
  let m
  while ((m = re.exec(text))) out.push(m[1])
  return out
}

function resolveImportLayer(fromFile, spec) {
  if (!spec.startsWith('.')) return null
  const fromDir = join(fromFile, '..')
  let abs = join(fromDir, spec)
  // strip extensionless; check directory index
  const candidates = [
    abs + '.ts',
    abs + '.tsx',
    join(abs, 'index.ts'),
    join(abs, 'index.tsx'),
  ]
  for (const c of candidates) {
    try {
      statSync(c)
      return layerOf(c)
    } catch {
      /* continue */
    }
  }
  // Best-effort from path segments
  const rel = relative(srcRoot, abs).replaceAll('\\', '/')
  if (rel.startsWith('adapters/mock')) return 'adapters/mock'
  const top = rel.split('/')[0]
  return top in layers ? top : null
}

const files = walk(srcRoot)
for (const file of files) {
  const rel = relative(root, file)
  const text = readFileSync(file, 'utf8')
  const lines = substantiveLines(text)
  if (lines > MAX_FILE) errors.push(`${rel}: ${lines} substantive lines > ${MAX_FILE}`)
  else if (lines > WARN_FILE) warnings.push(`${rel}: ${lines} substantive lines > target ${WARN_FILE}`)

  // rough function length: count braces between export function / function
  const fnRe = /(?:export\s+)?(?:async\s+)?function\s+\w+[^{]*\{/g
  let match
  while ((match = fnRe.exec(text))) {
    let depth = 0
    let i = match.index + match[0].length - 1
    const start = match.index
    for (; i < text.length; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}') {
        depth--
        if (depth === 0) {
          const body = text.slice(start, i + 1)
          const count = substantiveLines(body)
          const name = match[0].match(/function\s+(\w+)/)?.[1] ?? '?'
          if (count > MAX_FN) errors.push(`${rel}#${name}: ${count} lines > ${MAX_FN}`)
          else if (count > WARN_FN) warnings.push(`${rel}#${name}: ${count} lines > target ${WARN_FN}`)
          break
        }
      }
    }
  }

  const layer = layerOf(file)
  if (!layer) continue

  if (layer === 'model' || layer === 'application' || layer === 'presentation') {
    for (const rule of forbiddenInPure) {
      if (rule.test(text)) {
        errors.push(`${rel}: pure layer forbids pattern ${rule}`)
      }
    }
  }

  if (layer !== 'composition' && layer !== 'adapters/mock') {
    if (/adapters\/mock/.test(text) || /from ['"].*adapters\/mock/.test(text)) {
      errors.push(`${rel}: concrete mock import outside composition`)
    }
  }

  const allowed = layers[layer].mayImport
  if (!allowed.includes('*')) {
    for (const spec of importTargets(text)) {
      const target = resolveImportLayer(file, spec)
      if (!target || target === layer) continue
      if (!allowed.includes(target)) {
        errors.push(`${rel}: ${layer} must not import ${target} (${spec})`)
      }
    }
  }

  // features must not import adapters
  if (layer === 'features' && /adapters\//.test(text)) {
    errors.push(`${rel}: features must not import adapters`)
  }

  // components must not import application use cases beyond types via presentation/model
  if (layer === 'components' && /from ['"].*application/.test(text)) {
    errors.push(`${rel}: components must not import application`)
  }
}

for (const w of warnings) console.warn(`WARN ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`)
  process.exit(1)
}
console.log(`Architecture check passed (${files.length} files). Warnings: ${warnings.length}.`)
console.log('Note: green import checks do not prove semantic architecture correctness.')
