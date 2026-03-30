import { defineContentConfig, defineCollection, z } from '@nuxt/content'
import fs from 'node:fs'
import path from 'node:path'

function loadBrandConfig() {
  const configPath = path.resolve('./brand.config.json')
  const fallbackPath = path.resolve('./brand.config.default.json')
  try {
    const file = fs.existsSync(configPath) ? configPath : fallbackPath
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return { id: 'default', contentDir: 'default', showcaseDir: 'default-showcase' }
  }
}

const brand = loadBrandConfig()
const contentDir = brand.contentDir
const showcaseDir = brand.showcaseDir

const pageSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().optional(),
  video: z.string().optional(),
  type: z.enum(['company', 'individual']).default('company'),
  tags: z.array(z.string()).optional(),
  members: z.array(z.string()).optional(),
  company: z.string().optional(),
  companies: z.array(z.string()).optional(),
  vertical: z.boolean().default(false),
  hiddenCompany: z.boolean().default(false),
  hidden: z.boolean().default(false),
  nav: z.string().optional(),
  order: z.number().optional(),
  priority: z.boolean().default(false),
  contact: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.boolean().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    kvk: z.string().optional(),
    socials: z.object({
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
      facebook: z.string().optional(),
      x: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional()
    }).optional()
  }).optional()
})

export default defineContentConfig({
  collections: {
    // Generic default pages (always available as fallback)
    default_content: defineCollection({
      type: 'page',
      source: 'default/**/*.md',
      schema: pageSchema
    }),
    default_showcase: defineCollection({
      type: 'page',
      source: 'default-showcase/**/*.md',
      schema: pageSchema
    }),
    // Active brand pages (driven by brand.config.json)
    brand_content: defineCollection({
      type: 'page',
      source: `${contentDir}/**/*.md`,
      schema: pageSchema
    }),
    brand_showcase: defineCollection({
      type: 'page',
      source: `${showcaseDir}/**/*.md`,
      schema: pageSchema
    }),
  }
})
