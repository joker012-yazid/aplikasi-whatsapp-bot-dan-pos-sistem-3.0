import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../env.js'

const messageSchema = z.object({
  sessionId: z.string().min(1),
  phone: z.string().min(6),
  message: z.string().min(1),
  attachments: z.array(z.string().url()).optional()
})

const reminderSchema = z.object({
  jobId: z.string().uuid(),
  cadence: z.enum(['day1', 'day20', 'day30'])
})

export async function conciergeRoutes(app: FastifyInstance) {
  app.post('/concierge/messages', async (request, reply) => {
    const payload = messageSchema.parse(request.body)
    const { sessionId, phone, message, attachments } = payload

    const customer = await app.prisma.customer.upsert({
      where: { phone },
      update: { updatedAt: new Date() },
      create: { name: phone, phone }
    })

    const openJob = await app.prisma.job.findFirst({
      where: {
        customerId: customer.id,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    })

    const job =
      openJob ??
      (await app.prisma.job.create({
        data: {
          ticketNumber: `JOB-${Date.now()}`,
          customerId: customer.id,
          issueSummary: 'WhatsApp concierge intake',
          status: 'PENDING'
        }
      }))

    const messageLog = await app.prisma.messageLog.create({
      data: {
        customerId: customer.id,
        sessionId,
        jobId: job.id,
        direction: 'INBOUND',
        content: message,
        mediaUrl: attachments?.[0]
      }
    })

    await app.queues.concierge.add('concierge-intake', {
      messageId: messageLog.id,
      sessionId,
      phone,
      jobId: job.id
    })

    app.io.emit('whatsapp:message', {
      jobId: job.id,
      customerId: customer.id,
      sessionId,
      message: messageLog
    })

    reply.code(201)
    return { jobId: job.id, customerId: customer.id, messageId: messageLog.id }
  })

  app.post('/concierge/reminders', async (request, reply) => {
    const payload = reminderSchema.parse(request.body)
    const cadenceMap = {
      day1: 1,
      day20: 20,
      day30: 30
    } as const

    const job = await app.prisma.job.findUnique({ where: { id: payload.jobId } })
    if (!job) {
      return reply.code(404).send({ message: 'Job not found' })
    }

    const reminder = await app.prisma.reminder.create({
      data: {
        jobId: job.id,
        type: payload.cadence,
        sendAt: new Date(Date.now() + cadenceMap[payload.cadence] * 24 * 60 * 60 * 1000)
      }
    })

    await app.queues.notifications.add('reminder', {
      reminderId: reminder.id,
      jobId: job.id,
      sessionId: env.DEFAULT_SESSION_ID
    }, {
      delay: cadenceMap[payload.cadence] * 24 * 60 * 60 * 1000
    })

    return { reminderId: reminder.id }
  })

  app.post('/concierge/sessions/:id/connect', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string() })
    const { id } = paramsSchema.parse(request.params)

    const session = await app.sessionManager.getOrCreateSession(id)
    const status = await app.sessionManager.getSessionStatus(id)

    return { sessionId: id, status, hasSocket: Boolean(session) }
  })

  app.get('/concierge/sessions/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string() })
    const { id } = paramsSchema.parse(request.params)
    const status = await app.sessionManager.getSessionStatus(id)
    if (!status) {
      return reply.code(404).send({ message: 'Session not found' })
    }
    return status
  })
}
