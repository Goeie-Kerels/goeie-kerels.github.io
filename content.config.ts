import { defineContentConfig, defineCollection, z } from '@nuxt/content'

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
    // Default build (toffekerels.nl) pages
    content: defineCollection({
      type: 'page',
      source: 'default/**/*.md',
      schema: pageSchema
    }),
    // goeiekerels.nl pages
    goeiekerels_content: defineCollection({
      type: 'page',
      source: 'goeiekerels/**/*.md',
      schema: pageSchema
    }),
    // Default build (toffekerels.nl) showcase entries
    showcase: defineCollection({
      type: 'page',
      source: 'showcase/**/*.md',
      schema: pageSchema
    }),
    // goeiekerels.nl showcase entries
    goeiekerels_showcase: defineCollection({
      type: 'page',
      source: 'goeiekerels-showcase/**/*.md',
      schema: pageSchema
    }),
  }
})
