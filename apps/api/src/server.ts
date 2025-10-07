import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import formbody from '@fastify/formbody'
import fastifySocketIO from 'fastify-socket.io'
import pino from 'pino'
import { env, serverConfig } from './env.js'
import { prisma } from './prisma.js'
import { createQueues } from './queues.js'
import { BaileysSessionManager } from '@voltura/messaging'
import { conciergeRoutes } from './routes/concierge.js'
import { quotationRoutes } from './routes/quotation.js'
import { posRoutes } from './routes/pos.js'
import { crmRoutes } from './routes/crm.js'
import { dashboardRoutes } from './routes/dashboard.js'

export async function buildServer() {
  const app = Fastify({
    logger: pino({ level: process.env.LOG_LEVEL ?? 'info', name: 'api' })
  })

  await app.register(cors, { origin: true, credentials: true })
  await app.register(helmet)
  await app.register(formbody)
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX ?? 100,
    timeWindow: '1 minute'
  })
  await app.register(sensible)
  await app.register(fastifySocketIO, {
    cors: { origin: '*' },
    path: serverConfig.socketPath
  })

  const queues = createQueues()
  const sessionManager = new BaileysSessionManager({ prisma, baseDir: env.SESSION_DIR })

  app.decorate('prisma', prisma)
  app.decorate('queues', queues)
  app.decorate('sessionManager', sessionManager)

  sessionManager.on('session.qr', (payload) => {
    app.io.emit('whatsapp:session:qr', payload)
  })
  sessionManager.on('session.connected', (payload) => {
    app.io.emit('whatsapp:session:connected', payload)
  })
  sessionManager.on('session.disconnected', (payload) => {
    app.io.emit('whatsapp:session:disconnected', payload)
  })
  sessionManager.on('session.message', (payload) => {
    app.io.emit('whatsapp:session:message', payload)
  })

  app.get('/health', async () => ({ status: 'ok' }))

  await app.register(async (instance) => {
    await instance.register(conciergeRoutes)
    await instance.register(quotationRoutes)
    await instance.register(posRoutes)
    await instance.register(crmRoutes)
    await instance.register(dashboardRoutes)
  }, { prefix: '/api' })

  app.addHook('onClose', async () => {
    await queues.concierge.close()
    await queues.quotation.close()
    await queues.notifications.close()
  })

  return app
}
