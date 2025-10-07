import { config } from 'dotenv'
import { z } from 'zod'

config({ path: process.env.DOTENV_CONFIG_PATH })

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  SESSION_DIR: z.string().default('./storage/sessions'),
  DEFAULT_SESSION_ID: z.string().default('primary')
})

export const env = schema.parse(process.env)
