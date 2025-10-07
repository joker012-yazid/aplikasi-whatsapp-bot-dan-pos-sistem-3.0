import IORedis from 'ioredis'
import { env } from './env.js'

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
})

redis.on('error', (error) => {
  console.error('[redis] error', error)
})
