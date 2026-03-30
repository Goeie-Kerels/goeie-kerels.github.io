# Brand Architecture Migration Manual

This document is the step-by-step guide for migrating from the current mixed-brand repository to the new brand-config-driven architecture where each repository contains **only its own brand files**.

- **Primary repo** — `toffekerels` (GitHub: `Toffe-Kerels/toffe-kerels.github.io`)
- **Fork repo** — `goeiekerels` (GitHub: `Goeiekerels/goeiekerels.github.io` or equivalent)

---

## Overview of What Changes

| What | Before | After |
|---|---|---|
| Brand identity | Hardcoded in `nuxt.config.ts` | Read from `brand.config.json` |
| Content directories | `default/`, `showcase/`, `goeiekerels/`, `goeiekerels-showcase/` in both repos | Each repo has only `{brand}/` and `{brand}-showcase/` |
| Public images | Shared root `public/` assets | Per-brand in `public/brands/{id}/`, copied to root at build time |
| CSS | `main.css` + `goeiekerels.css` in both repos | `main.css` (base) + `brand.css` (gitignored, per-fork) |
| Layouts | `default.vue` + `goeiekerels.vue` in both repos | One `default.vue` in base; brand layout gitignored per-fork |
| Build scripts | Hardcoded goeiekerels variants in `package.json` | All brand-specific scripts removed from base |
| Prebuild check | None | `scripts/prebuild-check.mjs` validates everything before build |

---

## Part 0 — Before You Start: Full Backup

**Do this on every machine / in every checkout before touching anything.**

```bash
# On toffekerels machine
cd /path/to/toffekerels-repo
git checkout main
git pull
git tag backup/pre-migration-$(date +%Y%m%d)
git push origin backup/pre-migration-$(date +%Y%m%d)

# On goeiekerels machine
cd /path/to/goeiekerels-repo
git checkout main
git pull
git tag backup/pre-migration-$(date +%Y%m%d)
git push origin backup/pre-migration-$(date +%Y%m%d)
```

You can always restore to this tag with:
```bash
git checkout backup/pre-migration-YYYYMMDD
```

---

## Part 1 — Migrate the Toffekerels Repo (Primary)

Work in a new branch so main stays intact until you're satisfied.

### 1.1 Create a working branch

```bash
cd /path/to/toffekerels-repo
git checkout -b migration/brand-architecture
```

### 1.2 Create `brand.config.json`

Create this file at the project root. It is gitignored in the base repo but **force-tracked here** in the next step.

```json
{
  "id": "toffekerels",
  "name": "Toffe Kerels",
  "url": "https://toffekerels.nl",
  "logoText": "TOFFE",
  "logoSpan": "KERELS",
  "logoClass": "is-light has-orange",
  "descriptionKey": "footer.description.toffekerels",
  "email": "info@toffekerels.nl",
  "phone": "0412-480038",
  "address": "Raadhuislaan 2A, 5341GM Oss",
  "location": "Nederland",
  "copyright": "Toffe Kerels",
  "htmlLang": "nl",
  "themeColor": "#0f172a",
  "pwaDescription": "Showcase voor de tofste bedrijven in de regio.",
  "ogImageAlt": "Toffe Kerels – Showcase voor de tofste bedrijven",
  "contentDir": "toffekerels",
  "showcaseDir": "toffekerels-showcase"
}
```

### 1.3 Create `brand.config.default.json`

This neutral template is committed to the base repo so forks know what fields to fill in.

```json
{
  "id": "default",
  "name": "Mijn Platform",
  "url": "https://example.com",
  "logoText": "MIJN",
  "logoSpan": "PLATFORM",
  "logoClass": "is-light has-gradient",
  "descriptionKey": "footer.description.default",
  "email": "info@example.com",
  "phone": "",
  "address": "",
  "location": "Nederland",
  "copyright": "Mijn Platform",
  "htmlLang": "nl",
  "themeColor": "#0f172a",
  "pwaDescription": "Een showcase platform voor lokale ondernemers.",
  "ogImageAlt": "Mijn Platform – Showcase",
  "contentDir": "default",
  "showcaseDir": "default-showcase"
}
```

### 1.4 Rename content directories

The current `content/default/` and `content/showcase/` hold toffekerels content. Rename them:

```bash
# Rename in git (preserves full history)
git mv content/default    content/toffekerels
git mv content/showcase   content/toffekerels-showcase
```

### 1.5 Create neutral default content

The `content/default/` directory must exist in the base repo with placeholder content so the project is buildable without any brand config.

```bash
mkdir -p content/default
mkdir -p content/default-showcase/placeholder-bedrijf
```

Create `content/default/index.md`:
```markdown
---
title: Welkom op Mijn Platform
description: Een platform voor lokale ondernemers.
---

# Welkom

Dit is een voorbeeldpagina. Vervang deze inhoud met uw eigen tekst.
```

Create `content/default-showcase/placeholder-bedrijf/index.md`:
```markdown
---
title: Voorbeeldbedrijf
description: Dit is een voorbeeldvermelding.
type: company
hidden: false
---

# Voorbeeldbedrijf

Voeg hier uw eigen bedrijfsinformatie toe.
```

### 1.6 Move public brand assets

```bash
mkdir -p public/brands/toffekerels
mkdir -p public/brands/default

# Move toffekerels-specific assets into brand folder
cp public/favicon.svg              public/brands/toffekerels/favicon.svg
cp public/og-image.png             public/brands/toffekerels/og-image.png
cp public/icon-192.png             public/brands/toffekerels/icon-192.png
cp public/icon-512.png             public/brands/toffekerels/icon-512.png
cp public/apple-touch-icon.png     public/brands/toffekerels/apple-touch-icon.png

# Create neutral placeholder assets for the default brand
# (copy or create simple SVG/PNG placeholders — minimum viable files)
cp public/brands/toffekerels/favicon.svg          public/brands/default/favicon.svg
cp public/brands/toffekerels/icon-192.png         public/brands/default/icon-192.png
cp public/brands/toffekerels/icon-512.png         public/brands/default/icon-512.png
cp public/brands/toffekerels/apple-touch-icon.png public/brands/default/apple-touch-icon.png
cp public/brands/toffekerels/og-image.png         public/brands/default/og-image.png
# Replace the default/ copies with actual neutral images before committing to base repo.
```

Stage the new default assets (these go into the base repo):
```bash
git add public/brands/default/
```

### 1.7 Rename CSS

```bash
cp app/assets/css/main.css app/assets/css/brand.css
# brand.css will be force-tracked below; main.css stays as the neutral base
```

### 1.8 Update `.gitignore`

Replace the current `.gitignore` with one that excludes all brand-specific files:

```gitignore
node_modules
.nuxt
.nuxt-*
.data
.output
dist

# Brand config — force-tracked per brand repo, excluded from base
brand.config.json

# Brand content — force-tracked per brand repo
content/toffekerels/
content/toffekerels-showcase/
content/goeiekerels/
content/goeiekerels-showcase/

# Brand public assets — force-tracked per brand repo
public/brands/toffekerels/
public/brands/goeiekerels/

# Root public assets are generated at build time from public/brands/{id}/
public/favicon.svg
public/og-image.png
public/icon-192.png
public/icon-512.png
public/apple-touch-icon.png
public/apple-touch-icon-precomposed.png

# Brand-specific CSS and layout — force-tracked per brand repo
app/assets/css/brand.css
app/layouts/brand.vue
```

### 1.9 Force-track all toffekerels brand files

Files listed in `.gitignore` are normally invisible to git. Use `git add -f` to force-track them **once** in this repo. After that, git keeps tracking them automatically on every commit.

```bash
git add -f brand.config.json
git add -f content/toffekerels/
git add -f content/toffekerels-showcase/
git add -f public/brands/toffekerels/
git add -f app/assets/css/brand.css
```

### 1.10 Remove goeiekerels files from this repo

```bash
git rm -r content/goeiekerels/
git rm -r content/goeiekerels-showcase/
git rm    app/assets/css/goeiekerels.css
git rm    app/layouts/goeiekerels.vue
```

If there are any goeiekerels-specific public images (e.g. `public/favicon-goeiekerels.svg`):
```bash
git rm public/favicon-goeiekerels.svg 2>/dev/null || true
```

### 1.11 Commit the toffekerels migration

```bash
git add -A
git commit -m "chore: migrate to brand-config architecture (toffekerels)"
```

### 1.12 Verify the build

```bash
npm run generate
```

The prebuild check will report what is found. Fix any errors it flags, then re-run.

### 1.13 Merge to main

When satisfied:
```bash
git checkout main
git merge migration/brand-architecture
git push origin main
```

---

## Part 2 — Migrate the Goeiekerels Fork

### 2.1 Make sure your fork is up to date with the primary

```bash
cd /path/to/goeiekerels-repo

# Add the primary repo as upstream (if not already set)
git remote add upstream https://github.com/Toffe-Kerels/toffe-kerels.github.io.git

# Fetch and merge the migration changes from toffekerels main
git fetch upstream
git checkout main
git merge upstream/main
# Resolve any conflicts — most will be in nuxt.config.ts and package.json
```

At this point the fork has the new architecture but **still contains toffekerels brand files as gitignored** (they won't appear to git).

### 2.2 Create a working branch

```bash
git checkout -b migration/brand-architecture
```

### 2.3 Create `brand.config.json` for goeiekerels

```json
{
  "id": "goeiekerels",
  "name": "Goeiekerels",
  "url": "https://goeiekerels.nl",
  "logoText": "GOEIE",
  "logoSpan": "KERELS",
  "logoClass": "is-light has-blue",
  "descriptionKey": "footer.description.goeiekerels",
  "email": "info@goeiekerels.nl",
  "phone": "",
  "address": "",
  "location": "Nederland",
  "copyright": "Goeiekerels",
  "htmlLang": "nl",
  "themeColor": "#0f172a",
  "pwaDescription": "Showcase voor de goeieste bedrijven.",
  "ogImageAlt": "Goeiekerels – Showcase",
  "contentDir": "goeiekerels",
  "showcaseDir": "goeiekerels-showcase"
}
```

### 2.4 Move public brand assets

```bash
mkdir -p public/brands/goeiekerels

# Copy goeiekerels-specific assets (these should already exist from before the migration)
cp public/favicon-goeiekerels.svg    public/brands/goeiekerels/favicon.svg
# or, if the same icons were used:
cp public/icon-192.png               public/brands/goeiekerels/icon-192.png
cp public/icon-512.png               public/brands/goeiekerels/icon-512.png
cp public/apple-touch-icon.png       public/brands/goeiekerels/apple-touch-icon.png
cp public/og-image.png               public/brands/goeiekerels/og-image.png
# Replace these copies with the actual goeiekerels-specific images.
```

### 2.5 Create `brand.css` for goeiekerels

```bash
cp app/assets/css/goeiekerels.css app/assets/css/brand.css
```

### 2.6 Create `brand.vue` layout (if goeiekerels had its own layout)

```bash
cp app/layouts/goeiekerels.vue app/layouts/brand.vue
```

### 2.7 Ensure goeiekerels content is present

The goeiekerels content directories should already be here from before the merge. Verify:

```bash
ls content/goeiekerels/
ls content/goeiekerels-showcase/
```

If they're missing (because they were gitignored in upstream), copy them from your local backup or the old checkout.

### 2.8 Force-track goeiekerels brand files

```bash
git add -f brand.config.json
git add -f content/goeiekerels/
git add -f content/goeiekerels-showcase/
git add -f public/brands/goeiekerels/
git add -f app/assets/css/brand.css
git add -f app/layouts/brand.vue      # only if it exists
```

### 2.9 Remove toffekerels files from this repo

The toffekerels content directories are gitignored, so git doesn't see them — they simply won't be committed. However if any were previously tracked, untrack them:

```bash
# Check if any toffekerels files are currently tracked
git ls-files content/toffekerels content/toffekerels-showcase public/brands/toffekerels

# If any show up, remove them
git rm -r --cached content/toffekerels/          2>/dev/null || true
git rm -r --cached content/toffekerels-showcase/ 2>/dev/null || true
git rm -r --cached public/brands/toffekerels/    2>/dev/null || true
git rm    --cached app/assets/css/goeiekerels.css 2>/dev/null || true
git rm    --cached app/layouts/goeiekerels.vue    2>/dev/null || true
```

### 2.10 Update CNAME

```bash
echo "goeiekerels.nl" > CNAME
git add CNAME
```

### 2.11 Commit the goeiekerels migration

```bash
git add -A
git commit -m "chore: migrate to brand-config architecture (goeiekerels)"
```

### 2.12 Verify the build

```bash
npm run generate
```

The prebuild check will confirm all goeiekerels brand files are found.

### 2.13 Merge to main

```bash
git checkout main
git merge migration/brand-architecture
git push origin main
```

---

## Part 3 — Keeping Repos in Sync Going Forward

After migration, the workflow for pulling base-repo improvements into the fork is:

```bash
cd /path/to/goeiekerels-repo

# Pull upstream changes (only shared code, not brand files)
git fetch upstream
git merge upstream/main

# Brand files (content/goeiekerels/, brand.config.json, brand.css, etc.)
# are gitignored in upstream so they will NEVER be overwritten by a merge.
# They are force-tracked in this fork so they persist through every commit.
```

### What each repo contains after migration

| File/Folder | toffekerels repo | goeiekerels repo | base repo (hypothetical new fork) |
|---|---|---|---|
| `brand.config.json` | toffekerels config | goeiekerels config | copy of `brand.config.default.json` |
| `brand.config.default.json` | ✓ committed | ✓ committed (from upstream) | ✓ committed |
| `content/toffekerels/` | ✓ force-tracked | not present | not present |
| `content/goeiekerels/` | not present | ✓ force-tracked | not present |
| `content/default/` | ✓ committed | ✓ committed (from upstream) | ✓ committed |
| `public/brands/toffekerels/` | ✓ force-tracked | not present | not present |
| `public/brands/goeiekerels/` | not present | ✓ force-tracked | not present |
| `public/brands/default/` | ✓ committed | ✓ committed (from upstream) | ✓ committed |
| `app/assets/css/brand.css` | ✓ force-tracked | ✓ force-tracked (goeiekerels styles) | not present |
| `app/assets/css/main.css` | ✓ committed | ✓ committed (from upstream) | ✓ committed |
| `app/layouts/brand.vue` | not present | ✓ force-tracked (if used) | not present |
| `CNAME` | `toffekerels.nl` | `goeiekerels.nl` | not present |

---

## Part 4 — Restoring From Backup

If anything goes wrong at any point:

```bash
# Restore to the backup tag
git checkout backup/pre-migration-YYYYMMDD

# Create a new branch from the backup if you want to keep the failed migration as reference
git checkout -b restore/from-backup backup/pre-migration-YYYYMMDD
git push origin restore/from-backup

# Force-reset main to the backup tag (destructive — only if necessary)
git checkout main
git reset --hard backup/pre-migration-YYYYMMDD
git push --force origin main
```

---

## Part 5 — Starting a New Brand Fork

For any future brand (e.g. `superkerels`):

```bash
# 1. Fork the primary repo on GitHub

# 2. Clone and set up
git clone https://github.com/your-org/superkerels.github.io.git
cd superkerels.github.io

# 3. Create brand.config.json (copy from default and edit)
cp brand.config.default.json brand.config.json
# Edit brand.config.json: set id, name, url, contentDir, showcaseDir, etc.

# 4. Create content directories
mkdir -p content/superkerels
mkdir -p content/superkerels-showcase
# Add index.md and showcase entries

# 5. Add brand public assets
mkdir -p public/brands/superkerels
# Add favicon.svg, og-image.png, icon-192.png, icon-512.png, apple-touch-icon.png

# 6. Add brand CSS
cp app/assets/css/main.css app/assets/css/brand.css
# Customise brand.css with your brand colours and fonts

# 7. Set CNAME
echo "superkerels.nl" > CNAME

# 8. Force-track all brand files
git add -f brand.config.json
git add -f content/superkerels/
git add -f content/superkerels-showcase/
git add -f public/brands/superkerels/
git add -f app/assets/css/brand.css
git add CNAME

# 9. Run prebuild check to verify everything is in place
node scripts/prebuild-check.mjs

# 10. Commit and push
git commit -m "chore: initial superkerels brand setup"
git push origin main
```

That's it — no changes to the base repo needed.
