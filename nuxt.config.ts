import { defineNuxtConfig } from 'nuxt/config'
import fs from 'node:fs'
import path from 'node:path'

function loadBrandConfig() {
  const configPath = path.resolve('./brand.config.json')
  const fallbackPath = path.resolve('./brand.config.default.json')
  try {
    const file = fs.existsSync(configPath) ? configPath : fallbackPath
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return {
      id: 'default',
      name: 'Mijn Platform',
      url: 'https://example.com',
      logoText: 'MIJN',
      logoSpan: 'PLATFORM',
      logoClass: 'is-light has-gradient',
      descriptionKey: 'footer.description.default',
      email: 'info@example.com',
      phone: '',
      address: '',
      location: 'Nederland',
      copyright: 'Mijn Platform',
      htmlLang: 'nl',
      themeColor: '#0f172a',
      pwaDescription: 'Een platform voor lokale ondernemers.',
      ogImageAlt: 'Mijn Platform',
      contentDir: 'default',
      showcaseDir: 'default-showcase'
    }
  }
}

const brand = loadBrandConfig()
const buildTarget = process.env.NUXT_PUBLIC_BUILD_TARGET || brand.id

function getContentRoutes(contentDir: string, showcaseDir: string): string[] {
  const routes: string[] = []

  function scanDir(dir: string, base: string) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scanDir(path.join(dir, entry.name), `${base}/${entry.name}`)
      } else if (entry.name.endsWith('.md')) {
        const route = entry.name === 'index.md'
          ? base || '/'
          : `${base}/${entry.name.replace(/\.md$/, '')}`
        routes.push(route || '/')
      }
    }
  }

  scanDir(path.resolve(`content/${contentDir}`), '')

  const showcasePath = path.resolve(`content/${showcaseDir}`)
  if (fs.existsSync(showcasePath)) {
    for (const entry of fs.readdirSync(showcasePath, { withFileTypes: true })) {
      if (entry.isDirectory() && fs.existsSync(path.join(showcasePath, entry.name, 'index.md'))) {
        routes.push(`/${entry.name}`)
      }
    }
  }

  return [...new Set(routes)]
}

const contentRoutes = getContentRoutes(brand.contentDir, brand.showcaseDir)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-03-24',
  buildDir: process.env.NUXT_BUILD_DIR || '.nuxt',

  runtimeConfig: {
    public: {
      forceAppMode: false,
      buildTarget,
      brand
    }
  },
  compatibilityVersion: 4,
  ssr: true,

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: {
        lang: brand.htmlLang ?? 'nl',
        ...(buildTarget !== 'default' ? { 'data-brand': buildTarget } : {})
      },
      meta: [
        { name: 'apple-mobile-web-app-title', content: brand.name },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: `${brand.url}/og-image.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: brand.ogImageAlt },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${brand.url}/og-image.png` },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
      script: [
        {
          // Runs synchronously before first paint — same technique as theme-flash prevention.
          // Adds 'app-mode' class to <html> so CSS can hide .web-only-wrapper before any frame is drawn.
          innerHTML: `(function(){
  try {
    var s = window.matchMedia('(display-mode:standalone)').matches;
    var f = window.matchMedia('(display-mode:fullscreen)').matches;
    var c = !!(window.Capacitor && window.Capacitor.isNative);
    var stored = localStorage.getItem('appMode') === 'true';
    if (s || f || c || stored) { document.documentElement.classList.add('app-mode'); }
  } catch(e) {}
})();`,
          type: 'text/javascript'
        }
      ]
    }
  },

  css: [
    '~/assets/css/main.css',
    '~/assets/css/brand.css'
  ],

  modules: [
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
    '@vite-pwa/nuxt'
  ],

  content: {
    // Content v3 configuration
  },

  ogImage: {
    defaults: {
      renderer: 'satori'
    }
  },

  i18n: {
    locales: [
      { code: 'nl', file: 'nl.json', name: 'Nederlands' },
      { code: 'en', file: 'en.json', name: 'English' }
    ],
    lazy: true,
    defaultLocale: 'nl',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false
  },

  site: {
    url: brand.url,
    name: brand.name,
    description: brand.pwaDescription,
    defaultLocale: brand.htmlLang ?? 'nl'
  },

  seo: {
    fallbackTitle: false
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: brand.name,
      short_name: brand.name,
      description: brand.pwaDescription,
      theme_color: brand.themeColor ?? '#0f172a',
      background_color: brand.themeColor ?? '#0f172a',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webp,woff,woff2,json}'],
      maximumFileSizeToCacheInBytes: 5000000,
      runtimeCaching: [
        {
          urlPattern: new RegExp(`^${brand.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/.*`, 'i'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 86400 }
          }
        },
        {
          urlPattern: /\.(png|jpg|jpeg|webp|svg|gif|ico)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: { maxEntries: 100, maxAgeSeconds: 2592000 }
          }
        },
        {
          urlPattern: /\.(woff|woff2|ttf|eot)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts-cache',
            expiration: { maxEntries: 20, maxAgeSeconds: 2592000 }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    }
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', ...contentRoutes],
      autoSubfolderIndex: true
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/images/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/fonts/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } }
  },

  hooks: {
    'build:before': () => {
      // Copy brand assets to public root
      const brandAssetsDir = path.resolve(`public/brands/${buildTarget}`)
      const fallbackDir = path.resolve('public/brands/default')
      const publicDir = path.resolve('public')
      const assets = ['favicon.svg', 'og-image.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']

      for (const asset of assets) {
        const brandFile = path.join(brandAssetsDir, asset)
        const fallbackFile = path.join(fallbackDir, asset)
        const dest = path.join(publicDir, asset)
        const source = fs.existsSync(brandFile) ? brandFile : fallbackFile
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, dest)
        }
      }

      // Generate media-list.json
      const mediaDir = path.resolve(process.cwd(), 'public/images/media')
      if (fs.existsSync(mediaDir)) {
        const files = fs.readdirSync(mediaDir)
        const mediaList = files
          .filter(file => /\.(jpg|jpeg|png|webp|mp4|webm)$/i.test(file))
          .map(file => {
            const name = path.parse(file).name
            return {
              url: `/images/media/${file}`,
              alt: name.replace(/[_-]/g, ' '),
              type: /\.(mp4|webm)$/i.test(file) ? 'video' : 'image'
            }
          })
        fs.writeFileSync(
          path.resolve(process.cwd(), 'public/media-list.json'),
          JSON.stringify(mediaList, null, 2)
        )
      }
    }
  }
})
