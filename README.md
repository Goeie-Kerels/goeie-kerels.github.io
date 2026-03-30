# Multi-Brand Build System

This project supports multiple branded deployments from a single codebase. The active brand is controlled by a single environment variable: `NUXT_PUBLIC_BUILD_TARGET`.

---

## How It Works

The `NUXT_PUBLIC_BUILD_TARGET` environment variable (default: `default`) drives:

| Thing | Convention |
|---|---|
| Layout | `app/layouts/{target}.vue` |
| CSS | `app/assets/css/{target}.css` |
| Pages | `content/{target}/**/*.md` → collection `{target}_content` |
| Showcases | `content/{target}-showcase/**` → collection `{target}_showcase` |

When the variable is not set, everything falls back to `default` (toffekerels.nl).

---

## Current Build Targets

| Target | Domain | Status |
|---|---|---|
| `default` | toffekerels.nl | ✅ Active |
| `goeiekerels` | goeiekerels.nl | 🔧 Ready for content |

---

## Directory Structure

```
content/
  default/              ← toffekerels.nl pages
    index.md
    contact.md
    map.md
    meedoen.md
    showcase.md
    en/                 ← English translations
  goeiekerels/          ← goeiekerels.nl pages (add/remove .md files as needed)
  showcase/             ← toffekerels.nl showcase entries
  goeiekerels-showcase/ ← goeiekerels.nl showcase entries

app/
  layouts/
    default.vue         ← toffekerels.nl layout (loads main.css)
    goeiekerels.vue     ← goeiekerels.nl layout (loads goeiekerels.css)
  assets/css/
    main.css            ← toffekerels.nl styles
    goeiekerels.css     ← goeiekerels.nl styles (imports main.css, then overrides)
  composables/
    useBuildTarget.ts   ← returns { target, isDefault, isGoeiekerels }
```

---

## Adding a New Brand

To add a brand called `newbrand`:

1. **Layout**: create `app/layouts/newbrand.vue` (copy `goeiekerels.vue`, change import)
2. **CSS**: create `app/assets/css/newbrand.css` (copy `goeiekerels.css`, override variables)
3. **Pages**: create `content/newbrand/` with `.md` page files
4. **Page collection**: add `newbrand_content` to `content.config.ts` with `source: 'newbrand/**/*.md'`
5. **Showcases**: create `content/newbrand-showcase/` with showcase `.md` files
6. **Showcase collection**: add `newbrand_showcase` to `content.config.ts` with `source: 'newbrand-showcase/**'`
7. **GitHub Variable**: in the forked repo → Settings → Secrets and variables → Actions → Variables → add `BUILD_TARGET=newbrand`

That's it. No other code changes needed.

---

## Local Development

```bash
# toffekerels.nl (default)
npm run dev

# goeiekerels.nl
npm run dev:goeiekerels

# Generate static output for goeiekerels.nl
npm run generate:goeiekerels
```

---

## Media Processing Scripts

Both `generate-hero-reel.sh` and `process-showcase-media.sh` are build-target-aware. They read the `BUILD_TARGET` env var (default: `default`) and process only the showcase directory for that target — no cross-contamination between builds.

| Script | Default (toffekerels) | goeiekerels |
|---|---|---|
| Showcase source | `content/showcase/` | `content/goeiekerels-showcase/` |
| Hero reel source | `content/showcase/` videos | `content/goeiekerels-showcase/` videos |
| Public output | `public/images/showcase/`, `public/videos/showcase/` | same dirs, different slugs |

Run manually per target:
```bash
# Process default showcase media
npm run process-showcase

# Process goeiekerels showcase media
npm run process-showcase:goeiekerels

# Generate hero reel for default
npm run generate-hero

# Generate hero reel for goeiekerels
npm run generate-hero:goeiekerels
```

`prebuild` and `pregenerate` automatically run all targets in sequence before any build or generate command, so `npm run generate` and `npm run build` always process media for every brand.

---

## GitHub Actions Deploy

The workflow (`.github/workflows/deploy.yml`) reads the `BUILD_TARGET` repository variable:

```yaml
env:
  NUXT_PUBLIC_BUILD_TARGET: ${{ vars.BUILD_TARGET || 'default' }}
```

- **toffekerels repo**: no variable needed — falls back to `default` automatically.
- **goeiekerels fork**: set `BUILD_TARGET=goeiekerels` in repo Settings → Variables.

---

## Custom Domain (goeiekerels.nl fork)

1. Create `public/CNAME` containing `goeiekerels.nl`
2. In the forked repo: Settings → Pages → set custom domain to `goeiekerels.nl` → enable Enforce HTTPS
3. Configure DNS: point `goeiekerels.nl` A records to GitHub Pages IPs:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

---

## Implementation Status

- [x] `nuxt.config.ts` — added `buildTarget` to runtimeConfig, removed global CSS
- [x] `app/composables/useBuildTarget.ts` — created
- [x] `app/layouts/default.vue` — now imports `main.css` directly
- [x] `app/layouts/goeiekerels.vue` — created, imports `goeiekerels.css`
- [x] `app/assets/css/goeiekerels.css` — created (imports main.css as base)
- [x] `app/app.vue` — uses `<NuxtLayout :name="buildTarget">`
- [x] `content/` — pages moved to `content/default/`; `content/goeiekerels/` and `content/goeiekerels-showcase/` created
- [x] `content.config.ts` — added `goeiekerels_content` and `goeiekerels_showcase` collections
- [x] `app/pages/[...slug].vue` — queries `{target}_content` collection
- [x] `app/components/content/BusinessMap.vue` — queries `{target}_content` collection
- [x] `app/components/content/ShowcaseGrid.vue` — queries `{target}_showcase` collection
- [x] `app/components/content/CommunitySection.vue` — queries `{target}_showcase` collection
- [x] `app/components/content/ContactDirectory.vue` — queries `{target}_showcase` collection
- [x] `.github/workflows/deploy.yml` — passes `NUXT_PUBLIC_BUILD_TARGET` from GitHub Variable
- [x] `package.json` — added `dev:goeiekerels` and `generate:goeiekerels` scripts

## Remaining Steps (goeiekerels fork)

- [ ] Fork this repo to a new GitHub organisation/account
- [ ] Add `public/CNAME` with content `goeiekerels.nl`
- [ ] Add GitHub Variable `BUILD_TARGET=goeiekerels` in the forked repo settings
- [ ] Add pages to `content/goeiekerels/` (copy and adapt from `content/default/`)
- [ ] Add showcase entries to `content/goeiekerels-showcase/`
- [ ] Customise `app/assets/css/goeiekerels.css` with goeiekerels.nl brand colours/styles
- [ ] Configure DNS for `goeiekerels.nl`
