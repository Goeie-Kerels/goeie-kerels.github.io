#!/usr/bin/env node
/**
 * prebuild-check.mjs
 *
 * Validates that all required brand files and folders are present before building.
 * Reads brand.config.json (or brand.config.default.json as fallback) to determine
 * what the active brand expects, then checks every required path.
 *
 * Exits with code 1 and a clear remediation message if anything is missing.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ─── Colours ────────────────────────────────────────────────────────────────
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN  = '\x1b[32m'
const CYAN   = '\x1b[36m'
const BOLD   = '\x1b[1m'
const RESET  = '\x1b[0m'

function ok(msg)   { console.log(`  ${GREEN}✓${RESET}  ${msg}`) }
function warn(msg) { console.warn(`  ${YELLOW}⚠${RESET}  ${msg}`) }
function err(msg)  { console.error(`  ${RED}✗${RESET}  ${msg}`) }
function info(msg) { console.log(`${CYAN}${msg}${RESET}`) }

// ─── Load brand config ───────────────────────────────────────────────────────
function loadBrandConfig() {
  const brandPath   = path.join(ROOT, 'brand.config.json')
  const defaultPath = path.join(ROOT, 'brand.config.default.json')

  if (fs.existsSync(brandPath)) {
    try {
      return { file: 'brand.config.json', config: JSON.parse(fs.readFileSync(brandPath, 'utf-8')) }
    } catch (e) {
      console.error(`${RED}${BOLD}ERROR:${RESET} brand.config.json exists but could not be parsed: ${e.message}`)
      process.exit(1)
    }
  }

  if (fs.existsSync(defaultPath)) {
    try {
      return { file: 'brand.config.default.json', config: JSON.parse(fs.readFileSync(defaultPath, 'utf-8')) }
    } catch (e) {
      console.error(`${RED}${BOLD}ERROR:${RESET} brand.config.default.json could not be parsed: ${e.message}`)
      process.exit(1)
    }
  }

  return { file: null, config: null }
}

// ─── Determine active build target ──────────────────────────────────────────
function getBuildTargetFromCname() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf-8').trim()
    return raw.split('.')[0]
  } catch {
    return null
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
const envTarget  = process.env.NUXT_PUBLIC_BUILD_TARGET || null
const cnameTarget = getBuildTargetFromCname()
const activeTarget = envTarget || cnameTarget || 'default'

console.log()
info(`${BOLD}Prebuild brand check${RESET}`)
info(`──────────────────────────────────────────`)
console.log(`  Active brand target : ${BOLD}${activeTarget}${RESET}`)
console.log(`  Detected via        : ${envTarget ? 'NUXT_PUBLIC_BUILD_TARGET env' : cnameTarget ? 'CNAME file' : 'fallback (no CNAME, no env)'}`)
console.log()

const { file: configFile, config: brand } = loadBrandConfig()

const errors   = []
const warnings = []

// ─── 1. brand.config.json ────────────────────────────────────────────────────
info('Checking brand config...')

if (!configFile) {
  warnings.push(
    'Neither brand.config.json nor brand.config.default.json found.\n' +
    '    → Copy brand.config.default.json to brand.config.json and fill in your brand details.'
  )
  warn('No brand.config.json found — using built-in defaults')
} else if (configFile === 'brand.config.default.json') {
  if (activeTarget !== 'default') {
    warnings.push(
      `CNAME/env points to brand "${activeTarget}" but only brand.config.default.json is present.\n` +
      '    → Copy brand.config.default.json to brand.config.json and set "id" to your brand name.'
    )
    warn(`Using default config — brand "${activeTarget}" has no brand.config.json`)
  } else {
    ok('brand.config.default.json loaded (default target)')
  }
} else {
  ok(`brand.config.json loaded (id: "${brand.id}")`)

  // Validate brand id matches active target
  if (brand.id && brand.id !== activeTarget) {
    warnings.push(
      `brand.config.json has "id": "${brand.id}" but the active build target is "${activeTarget}".\n` +
      `    → Either update brand.config.json "id" to "${activeTarget}" or correct your CNAME / env variable.`
    )
    warn(`Brand id mismatch: config says "${brand.id}", target is "${activeTarget}"`)
  }
}

// ─── 2. CNAME / env consistency ─────────────────────────────────────────────
console.log()
info('Checking CNAME / environment...')

const cnameFile = path.join(ROOT, 'CNAME')
if (activeTarget !== 'default') {
  if (!fs.existsSync(cnameFile) && !envTarget) {
    warnings.push(
      'No CNAME file found and NUXT_PUBLIC_BUILD_TARGET is not set.\n' +
      '    → Create a CNAME file with your domain (e.g. "toffekerels.nl") or set the env variable.'
    )
    warn('No CNAME file and no env variable — defaulting to "default" brand')
  } else if (fs.existsSync(cnameFile)) {
    ok(`CNAME present (${fs.readFileSync(cnameFile, 'utf-8').trim()})`)
  }
  if (envTarget) {
    ok(`NUXT_PUBLIC_BUILD_TARGET=${envTarget}`)
  }
} else {
  if (!fs.existsSync(cnameFile) && !envTarget) {
    ok('No CNAME or env set — using default brand')
  }
}

// ─── 3. Content directories ──────────────────────────────────────────────────
console.log()
info('Checking content directories...')

const contentDir  = brand?.contentDir  || (activeTarget === 'default' ? 'default' : activeTarget)
const showcaseDir = brand?.showcaseDir || (activeTarget === 'default' ? 'default-showcase' : `${activeTarget}-showcase`)

const contentPath  = path.join(ROOT, 'content', contentDir)
const showcasePath = path.join(ROOT, 'content', showcaseDir)

if (!fs.existsSync(contentPath)) {
  errors.push(
    `Content directory missing: content/${contentDir}/\n` +
    `    → Create the folder and add at least an index.md file.\n` +
    `    → If this is a brand fork, run: git add -f content/${contentDir}/`
  )
  err(`content/${contentDir}/ — NOT FOUND`)
} else {
  const files = fs.readdirSync(contentPath).filter(f => f.endsWith('.md'))
  if (files.length === 0) {
    warnings.push(
      `Content directory content/${contentDir}/ exists but contains no .md files.\n` +
      '    → Add at least index.md to get a working homepage.'
    )
    warn(`content/${contentDir}/ — exists but empty`)
  } else {
    ok(`content/${contentDir}/ — ${files.length} markdown file(s)`)
  }
}

if (!fs.existsSync(showcasePath)) {
  warnings.push(
    `Showcase directory missing: content/${showcaseDir}/\n` +
    `    → Create the folder even if empty, or the showcase page will have no entries.\n` +
    `    → If this is a brand fork, run: git add -f content/${showcaseDir}/`
  )
  warn(`content/${showcaseDir}/ — NOT FOUND (showcase will be empty)`)
} else {
  const entries = fs.readdirSync(showcasePath)
  ok(`content/${showcaseDir}/ — ${entries.length} entry/entries`)
}

// ─── 4. Brand public assets ──────────────────────────────────────────────────
console.log()
info('Checking public brand assets...')

const requiredPublicAssets = [
  'favicon.svg',
  'og-image.png',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
]

const brandAssetsDir  = path.join(ROOT, 'public', 'brands', activeTarget)
const defaultAssetsDir = path.join(ROOT, 'public', 'brands', 'default')

// Check if brand-specific assets folder exists (new architecture)
const hasBrandAssetsDir  = fs.existsSync(brandAssetsDir)
const hasDefaultAssetsDir = fs.existsSync(defaultAssetsDir)

// Also check legacy: assets directly in public/ root
const hasLegacyAssets = requiredPublicAssets.every(a => fs.existsSync(path.join(ROOT, 'public', a)))

if (activeTarget !== 'default' && !hasBrandAssetsDir && !hasLegacyAssets) {
  errors.push(
    `Brand public assets missing for "${activeTarget}".\n` +
    `    → Create public/brands/${activeTarget}/ with: ${requiredPublicAssets.join(', ')}\n` +
    `    → If this is a brand fork, run: git add -f public/brands/${activeTarget}/`
  )
  err(`public/brands/${activeTarget}/ — NOT FOUND`)
} else if (hasBrandAssetsDir) {
  const missing = requiredPublicAssets.filter(a => !fs.existsSync(path.join(brandAssetsDir, a)))
  if (missing.length > 0) {
    errors.push(
      `Missing brand assets in public/brands/${activeTarget}/: ${missing.join(', ')}\n` +
      `    → Add the missing files to public/brands/${activeTarget}/`
    )
    err(`public/brands/${activeTarget}/ — missing: ${missing.join(', ')}`)
  } else {
    ok(`public/brands/${activeTarget}/ — all ${requiredPublicAssets.length} assets present`)
  }
  if (!hasDefaultAssetsDir) {
    warnings.push(
      'public/brands/default/ not found.\n' +
      '    → Create it with placeholder assets as fallback for the base repo.'
    )
    warn('public/brands/default/ — missing (no fallback assets)')
  }
} else if (hasLegacyAssets) {
  warn(`Assets found directly in public/ (legacy layout). Consider moving to public/brands/${activeTarget}/`)
  ok('Legacy public assets present — build will work but migration is recommended')
}

// ─── 5. Brand CSS ────────────────────────────────────────────────────────────
console.log()
info('Checking brand stylesheet...')

const brandCssPath   = path.join(ROOT, 'app', 'assets', 'css', 'brand.css')
const mainCssPath    = path.join(ROOT, 'app', 'assets', 'css', 'main.css')
const legacyCssPath  = path.join(ROOT, 'app', 'assets', 'css', `${activeTarget}.css`)

if (fs.existsSync(brandCssPath)) {
  ok('app/assets/css/brand.css — found')
} else if (fs.existsSync(legacyCssPath)) {
  warn(`app/assets/css/${activeTarget}.css found (legacy name). Consider renaming to brand.css.`)
} else if (fs.existsSync(mainCssPath)) {
  if (activeTarget !== 'default') {
    warnings.push(
      `No brand.css found for target "${activeTarget}".\n` +
      `    → Create app/assets/css/brand.css with brand-specific styles.\n` +
      `    → If this is a brand fork, run: git add -f app/assets/css/brand.css\n` +
      '    → main.css will be used as fallback.'
    )
    warn(`app/assets/css/brand.css — not found (main.css will be used)`)
  } else {
    ok('app/assets/css/main.css — found (default brand)')
  }
} else {
  warnings.push(
    'No CSS file found (brand.css or main.css).\n' +
    '    → Create app/assets/css/main.css as the base stylesheet.'
  )
  warn('No stylesheet found')
}

// ─── 6. i18n files ───────────────────────────────────────────────────────────
console.log()
info('Checking i18n locale files...')

const i18nDir = path.join(ROOT, 'i18n', 'locales')
if (fs.existsSync(i18nDir)) {
  const localeFiles = fs.readdirSync(i18nDir).filter(f => f.endsWith('.json'))
  if (localeFiles.length === 0) {
    warnings.push(
      'No locale files found in i18n/locales/.\n' +
      '    → Add at least nl.json for Dutch language support.'
    )
    warn('i18n/locales/ — no locale files found')
  } else {
    ok(`i18n/locales/ — ${localeFiles.join(', ')}`)
  }
} else {
  warnings.push(
    'i18n/locales/ directory not found.\n' +
    '    → Create it and add locale JSON files (e.g. nl.json, en.json).'
  )
  warn('i18n/locales/ — directory not found')
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log()
info(`──────────────────────────────────────────`)

if (warnings.length > 0) {
  console.log()
  console.warn(`${YELLOW}${BOLD}Warnings (${warnings.length}):${RESET}`)
  warnings.forEach((w, i) => console.warn(`\n  ${YELLOW}${i + 1}.${RESET} ${w}`))
}

if (errors.length > 0) {
  console.log()
  console.error(`${RED}${BOLD}Errors (${errors.length}) — build cannot proceed:${RESET}`)
  errors.forEach((e, i) => console.error(`\n  ${RED}${i + 1}.${RESET} ${e}`))
  console.log()
  console.error(`${RED}${BOLD}Fix the errors above, then run the build again.${RESET}`)
  console.log()
  process.exit(1)
}

console.log()
if (warnings.length > 0) {
  console.log(`${YELLOW}${BOLD}Prebuild check passed with ${warnings.length} warning(s). Proceeding...${RESET}`)
} else {
  console.log(`${GREEN}${BOLD}Prebuild check passed. All required files present.${RESET}`)
}
console.log()
