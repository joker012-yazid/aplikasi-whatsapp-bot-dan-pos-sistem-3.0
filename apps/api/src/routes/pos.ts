import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../env.js'

const inventoryItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(0),
  costPrice: z.coerce.number().nonnegative().optional(),
  sellPrice: z.coerce.number().nonnegative().optional()
})

const updateStockSchema = z.object({
  quantity: z.number().int(),
  reason: z.string().optional()
})

const saleSchema = z.object({
  customerId: z.string().uuid().optional(),
  customer: z
    .object({
      name: z.string().min(1),
      phone: z.string().min(6)
    })
    .optional(),
  jobId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid().optional(),
        description: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative()
      })
    )
    .min(1),
  payments: z
    .array(
      z.object({
        amount: z.number().positive(),
        method: z.string().min(1),
        reference: z.string().optional()
      })
    )
    .optional()
})

export async function posRoutes(app: FastifyInstance) {
  app.post('/inventory/items', async (request, reply) => {
    const payload = inventoryItemSchema.parse(request.body)
    const item = await app.prisma.inventoryItem.create({
      data: {
        sku: payload.sku,
        name: payload.name,
        description: payload.description,
        quantity: payload.quantity,
        reorderLevel: payload.reorderLevel,
        costPrice: payload.costPrice !== undefined ? payload.costPrice.toFixed(2) : undefined,
        sellPrice: payload.sellPrice !== undefined ? payload.sellPrice.toFixed(2) : undefined
      }
    })

    reply.code(201)
    return item
  })

  app.patch('/inventory/items/:id/stock', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)
    const payload = updateStockSchema.parse(request.body)

    const item = await app.prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: { increment: payload.quantity }
      }
    })

    app.io.emit('inventory:updated', { itemId: id, quantity: item.quantity })
    return item
  })

  app.post('/pos/sales', async (request, reply) => {
    const payload = saleSchema.parse(request.body)
    const { customerId, customer: customerInput, jobId, items, payments } = payload

    let resolvedCustomerId = customerId ?? null
    if (!resolvedCustomerId && customerInput) {
      const customer = await app.prisma.customer.upsert({
        where: { phone: customerInput.phone },
        update: { name: customerInput.name },
        create: { name: customerInput.name, phone: customerInput.phone }
      })
      resolvedCustomerId = customer.id
    }

    if (!resolvedCustomerId) {
      return reply.code(400).send({ message: 'Customer information is required' })
    }

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const invoice = await app.prisma.invoice.create({
      data: {
        number: `POS-${Date.now()}`,
        customerId: resolvedCustomerId,
        jobId: jobId ?? undefined,
        total: total.toFixed(2),
        balance: total.toFixed(2),
        metadata: { lineItems: items }
      }
    })

    for (const line of items) {
      if (line.itemId) {
        await app.prisma.inventoryItem.update({
          where: { id: line.itemId },
          data: {
            quantity: { decrement: line.quantity }
          }
        })
      }
    }

    let remainingBalance = total
    if (payments) {
      for (const payment of payments) {
        await app.prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: payment.amount.toFixed(2),
            method: payment.method,
            reference: payment.reference
          }
        })
        remainingBalance -= payment.amount
      }
    }

    const updatedInvoice = await app.prisma.invoice.update({
      where: { id: invoice.id },
      data: { balance: remainingBalance.toFixed(2) }
    })

    await app.queues.notifications.add('pos-sale', {
      invoiceId: invoice.id,
      customerId: resolvedCustomerId,
      sessionId: env.DEFAULT_SESSION_ID
    })
    app.io.emit('pos:invoice', updatedInvoice)

    reply.code(201)
    return updatedInvoice
  })

  app.get('/inventory/items', async () => {
    return app.prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } })
  })
}
