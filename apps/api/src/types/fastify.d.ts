import 'fastify'
import type { PrismaClient } from '@prisma/client'
import type { Server as SocketIOServer } from 'socket.io'
import type { AppQueues } from '../queues.js'
import type { BaileysSessionManager } from '@voltura/messaging'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    queues: AppQueues
    sessionManager: BaileysSessionManager
    io: SocketIOServer
  }
}
