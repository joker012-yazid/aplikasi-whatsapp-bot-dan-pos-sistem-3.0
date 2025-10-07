import { PrismaClient } from '@prisma/client'
import pino from 'pino'

const logger = pino({ name: 'prisma', level: process.env.LOG_LEVEL ?? 'info' })

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
  errorFormat: 'pretty'
})

prisma.$on('error', (event: unknown) => {
  logger.error(event, 'Prisma error')
})

process.once('beforeExit', async () => {
  await prisma.$disconnect()
})
