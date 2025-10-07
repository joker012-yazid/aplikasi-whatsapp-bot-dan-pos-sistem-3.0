import { Worker, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import pino from 'pino'
import { env } from './env.js'
import { BaileysSessionManager } from '@voltura/messaging'

const logger = pino({ name: 'worker', level: process.env.LOG_LEVEL ?? 'info' })

const QUEUE_NAMES = {
  concierge: 'concierge-messages',
  quotation: 'quotation-followups',
  notifications: 'notification-outbox'
} as const

type ConciergeJobData = {
  messageId: string
  sessionId: string
  phone: string
  jobId: string
}

type QuotationJobData = {
  quotationId: string
  customerId: string
  jobId?: string | null
  sessionId?: string
}

type NotificationJobData =
  | { type: 'reminder'; reminderId: string; jobId: string; sessionId?: string }
  | { type: 'quotation-accepted'; quotationId: string; invoiceId: string; sessionId?: string }
  | { type: 'quotation-rejected'; quotationId: string; sessionId?: string }
  | { type: 'pos-sale'; invoiceId: string; customerId: string; sessionId?: string }

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
})

const prisma = new PrismaClient()
const sessionManager = new BaileysSessionManager({ prisma, baseDir: env.SESSION_DIR, logger })

const queueEvents: QueueEvents[] = []

const conciergeWorker = new Worker<ConciergeJobData>(
  QUEUE_NAMES.concierge,
  async (job) => {
    const { messageId, sessionId, phone, jobId } = job.data
    const message = await prisma.messageLog.findUnique({
      where: { id: messageId },
      include: { customer: true }
    })
    if (!message || !message.customer) {
      logger.warn({ messageId }, 'message not found for concierge job')
      return
    }

    await prisma.messageLog.update({
      where: { id: messageId },
      data: { processed: true, processedAt: new Date() }
    })

    const customerName = message.customer.name ?? message.customer.phone
    const acknowledgement = `Hai ${customerName}, terima kasih kerana menghubungi Voltura Service Hub. Pasukan kami sedang semak mesej anda.`
    const jid = `${phone}@s.whatsapp.net`

    await sessionManager.sendTextMessage(sessionId, jid, acknowledgement)

    await prisma.messageLog.create({
      data: {
        customerId: message.customerId,
        sessionId,
        jobId,
        direction: 'OUTBOUND',
        content: acknowledgement
      }
    })

    logger.info({ messageId }, 'processed concierge intake')
    return { delivered: true }
  },
  { connection, concurrency: 5 }
)

const quotationWorker = new Worker<QuotationJobData>(
  QUEUE_NAMES.quotation,
  async (job) => {
    const { quotationId } = job.data
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true, job: true }
    })
    if (!quotation || !quotation.customer.phone) {
      logger.warn({ quotationId }, 'quotation missing customer phone')
      return
    }

    const jid = `${quotation.customer.phone}@s.whatsapp.net`
    const total = Number(quotation.total)
    const messageLines = [
      `Sebutharga #${quotation.number}`,
      `Jumlah: RM${total.toFixed(2)}`,
      'Balas SETUJU untuk teruskan atau TAK SETUJU untuk batalkan.'
    ]
    const sessionId = job.data.sessionId ?? env.DEFAULT_SESSION_ID
    await sessionManager.sendTextMessage(sessionId, jid, messageLines.join('\n'))

    logger.info({ quotationId }, 'sent quotation notification')
  },
  { connection }
)

const notificationsWorker = new Worker<NotificationJobData>(
  QUEUE_NAMES.notifications,
  async (job) => {
    const sessionId = (job.data as NotificationJobData).sessionId ?? env.DEFAULT_SESSION_ID
    switch (job.name) {
      case 'reminder': {
        const data = job.data as NotificationJobData & { type: 'reminder' }
        const reminder = await prisma.reminder.findUnique({
          where: { id: data.reminderId },
          include: { job: { include: { customer: true } } }
        })
        if (!reminder?.job?.customer?.phone) {
          logger.warn({ reminderId: data.reminderId }, 'reminder missing phone number')
          return
        }
        const jid = `${reminder.job.customer.phone}@s.whatsapp.net`
        const text = `Hai ${reminder.job.customer.name ?? 'pelanggan'}, ini peringatan mengenai tiket ${reminder.job.ticketNumber}.`
        await sessionManager.sendTextMessage(sessionId, jid, text)
        await prisma.reminder.update({ where: { id: reminder.id }, data: { sentAt: new Date() } })
        break
      }
      case 'quotation-accepted': {
        const data = job.data as Extract<NotificationJobData, { type: 'quotation-accepted' }>
        const quotation = await prisma.quotation.findUnique({
          where: { id: data.quotationId },
          include: { customer: true }
        })
        if (!quotation?.customer.phone) return
        const jid = `${quotation.customer.phone}@s.whatsapp.net`
        await sessionManager.sendTextMessage(sessionId, jid, `Sebutharga ${quotation.number} diterima. Invoice anda sedang disediakan.`)
        break
      }
      case 'quotation-rejected': {
        const data = job.data as Extract<NotificationJobData, { type: 'quotation-rejected' }>
        const quotation = await prisma.quotation.findUnique({
          where: { id: data.quotationId },
          include: { customer: true }
        })
        if (!quotation?.customer.phone) return
        const jid = `${quotation.customer.phone}@s.whatsapp.net`
        await sessionManager.sendTextMessage(sessionId, jid, `Sebutharga ${quotation.number} telah dibatalkan. Hubungi kami jika perlukan bantuan lain.`)
        break
      }
      case 'pos-sale': {
        const data = job.data as Extract<NotificationJobData, { type: 'pos-sale' }>
        const invoice = await prisma.invoice.findUnique({
          where: { id: data.invoiceId },
          include: { customer: true }
        })
        if (!invoice?.customer.phone) return
        const jid = `${invoice.customer.phone}@s.whatsapp.net`
        await sessionManager.sendTextMessage(sessionId, jid, `Terima kasih! Resit POS ${invoice.number} berjumlah RM${Number(invoice.total).toFixed(2)}.`)
        break
      }
      default:
        logger.warn({ name: job.name }, 'unhandled notification job')
    }
  },
  { connection, concurrency: 10 }
)

for (const [name, worker] of [
  ['concierge', conciergeWorker],
  ['quotation', quotationWorker],
  ['notifications', notificationsWorker]
] as const) {
  const events = new QueueEvents(QUEUE_NAMES[name], { connection })
  queueEvents.push(events)
  events.on('failed', ({ jobId, failedReason }) => {
    logger.error({ queue: name, jobId, failedReason }, 'job failed')
  })
  worker.on('error', (error) => {
    logger.error({ queue: name, error }, 'worker error')
  })
}

const shutdown = async () => {
  logger.info('shutting down workers')
  await prisma.$disconnect()
  await Promise.all([
    conciergeWorker.close(),
    quotationWorker.close(),
    notificationsWorker.close(),
    ...queueEvents.map((events) => events.close()),
    connection.quit()
  ])
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
