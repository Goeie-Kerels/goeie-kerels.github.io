import { defineNuxtConfig } from 'nuxt/config'
import fs from 'node:fs'
import path from 'node:path'
function getBuildTargetFromCname(): string {
  try {
    const cname = fs.readFileSync(path.resolve('./CNAME'), 'utf-8').trim()
    const name = cname.split('.')[0]
    return name || 'default'
  } catch {
    return 'default'
  }
}

const buildTarget = process.env.NUXT_PUBLIC_BUILD_TARGET || getBuildTargetFromCname()
console.log(`[nuxt.config] NUXT_PUBLIC_BUILD_TARGET env: "${process.env.NUXT_PUBLIC_BUILD_TARGET ?? '(unset)'}" → resolved buildTarget: "${buildTarget}"`)
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-03-24',
  buildDir: process.env.NUXT_BUILD_DIR || '.nuxt',

  runtimeConfig: {
    public: {
      forceAppMode: false,
      buildTarget,
      brands: {
        default: {
          name: 'Toffe Kerels',
          logoText: 'TOFFE',
          logoSpan: 'KERELS',
          logoClass: 'is-light has-orange',
          description: 'footer.description.default',
          email: 'info@toffekerels.nl',
          phone: '0412-480038',
          address: 'Raadhuislaan 2A, 5341GM Oss',
          location: 'Nederland',
          copyright: 'Toffe Kerels'
        },
        goeiekerels: {
          name: 'goeiekerels',
          logoText: '',
          logoSpan: '',
          logoClass: '',
          description: 'footer.description.goeiekerels',
          email: 'info@goeiekerels.nl',
          phone: '',
          address: '',
          location: 'Nederland',
          copyright: 'goeiekerels'
        }
      }
    }
  },
  compatibilityVersion: 4,
  ssr: true,

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: {
        lang: 'nl',
        ...(buildTarget === 'goeiekerels' ? { 'data-brand': 'goeiekerels' } : {})
      },
      meta: [
        { name: 'apple-mobile-web-app-title', content: 'Toffe Kerels' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://toffekerels.nl/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Toffe Kerels – Showcase voor de tofste bedrijven' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://toffekerels.nl/og-image.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: buildTarget === 'goeiekerels' ? '/favicon-goeiekerels.svg' : '/favicon.svg' },
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

  // css is loaded per-layout so each build target can have its own stylesheet

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
    url: 'https://toffekerels.nl',
    name: 'Toffe Kerels',
    description: 'Showcase voor de tofste bedrijven. Moderne websites voor lokale ondernemers.',
    defaultLocale: 'nl'
  },

  seo: {
    fallbackTitle: false
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Toffe Kerels',
      short_name: 'Toffe Kerels',
      description: 'Showcase voor de tofste bedrijven in de regio.',
      theme_color: '#0f172a',
      background_color: '#0f172a',
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
          urlPattern: /^https:\/\/toffekerels\.nl\/.*/i,
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
      routes: ['/'],
      autoSubfolderIndex: true
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/images/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/fonts/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } }
  },

  experimental: {
    inlineStyles: true
  },

  hooks: {
    'build:before': () => {
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
