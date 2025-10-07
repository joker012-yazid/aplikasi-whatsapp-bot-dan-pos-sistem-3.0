import { config } from 'dotenv'
import { z } from 'zod'

config({ path: process.env.DOTENV_CONFIG_PATH })

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().optional(),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  SESSION_DIR: z.string().default('./storage/sessions'),
  SOCKET_IO_PATH: z.string().default('/socket.io'),
  DEFAULT_SESSION_ID: z.string().default('primary'),
  RATE_LIMIT_MAX: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
})

export const env = envSchema.parse(process.env)

export const serverConfig = {
  port: env.PORT ? Number.parseInt(env.PORT, 10) : 4000,
  host: env.HOST,
  socketPath: env.SOCKET_IO_PATH
}
