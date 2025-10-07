import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../env.js'

const customerSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).optional(),
    phone: z.string().min(6).optional(),
    email: z.string().email().optional()
  })
  .refine((value) => Boolean(value.id || (value.name && value.phone)), {
    message: 'Provide an existing customer id or the name and phone for a new customer'
  })

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative()
})

const createQuotationSchema = z.object({
  customer: customerSchema,
  jobId: z.string().uuid().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  notes: z.string().optional(),
  validUntil: z.coerce.date().optional()
})

export async function quotationRoutes(app: FastifyInstance) {
  app.post('/quotations', async (request, reply) => {
    const payload = createQuotationSchema.parse(request.body)
    const { customer: customerInput, jobId, lineItems, validUntil, notes } = payload

    let customerId: string
    if (customerInput.id) {
      customerId = customerInput.id
    } else {
      const customer = await app.prisma.customer.upsert({
        where: { phone: customerInput.phone! },
        update: { name: customerInput.name ?? customerInput.phone, email: customerInput.email },
        create: {
          name: customerInput.name ?? customerInput.phone!,
          phone: customerInput.phone!,
          email: customerInput.email
        }
      })
      customerId = customer.id
    }

    let relatedJobId = jobId ?? null
    if (!relatedJobId) {
      const job = await app.prisma.job.create({
        data: {
          ticketNumber: `JOB-${Date.now()}`,
          customerId,
          issueSummary: notes ?? 'Quotation request',
          status: 'PENDING'
        }
      })
      relatedJobId = job.id
    }

    const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const quotation = await app.prisma.quotation.create({
      data: {
        number: `QT-${Date.now()}`,
        customerId,
        jobId: relatedJobId,
        status: 'SENT',
        total: total.toFixed(2),
        lineItems,
        validUntil: validUntil ?? undefined
      },
      include: {
        customer: true,
        job: true
      }
    })

    if (relatedJobId) {
      await app.prisma.job.update({
        where: { id: relatedJobId },
        data: { estimatedCost: total.toFixed(2) }
      })
    }

    await app.queues.quotation.add('quotation-sent', {
      quotationId: quotation.id,
      customerId,
      jobId: relatedJobId,
      sessionId: env.DEFAULT_SESSION_ID
    })

    app.io.emit('quotations:created', quotation)

    reply.code(201)
    return quotation
  })

  app.post('/quotations/:id/accept', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)

    const quotation = await app.prisma.quotation.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        approvedAt: new Date()
      },
      include: {
        customer: true,
        job: true
      }
    })

    if (quotation.jobId) {
      await app.prisma.job.update({
        where: { id: quotation.jobId },
        data: { status: 'IN_PROGRESS' }
      })
    }

    const existingInvoice = await app.prisma.invoice.findFirst({ where: { quotationId: quotation.id } })
    const invoice = existingInvoice
      ? await app.prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: {
            total: quotation.total,
            balance: quotation.total,
            metadata: { lineItems: quotation.lineItems }
          }
        })
      : await app.prisma.invoice.create({
          data: {
            number: `INV-${Date.now()}`,
            customerId: quotation.customerId,
            jobId: quotation.jobId ?? undefined,
            quotationId: quotation.id,
            total: quotation.total,
            balance: quotation.total,
            metadata: { lineItems: quotation.lineItems }
          }
        })

    app.io.emit('quotations:accepted', { quotationId: id, invoiceId: invoice.id })
    await app.queues.notifications.add('quotation-accepted', {
      quotationId: id,
      invoiceId: invoice.id,
      sessionId: env.DEFAULT_SESSION_ID
    })

    return { quotationId: id, invoiceId: invoice.id }
  })

  app.post('/quotations/:id/reject', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)

    await app.prisma.quotation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date()
      }
    })

    await app.queues.notifications.add('quotation-rejected', {
      quotationId: id,
      sessionId: env.DEFAULT_SESSION_ID
    })
    app.io.emit('quotations:rejected', { quotationId: id })

    return { quotationId: id }
  })
}
