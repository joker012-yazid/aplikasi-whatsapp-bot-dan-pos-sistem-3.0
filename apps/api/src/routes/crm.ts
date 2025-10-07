import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

export async function crmRoutes(app: FastifyInstance) {
  app.get('/crm/customers', async () => {
    const customers = await app.prisma.customer.findMany({
      include: {
        _count: {
          select: {
            jobs: true,
            invoices: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    type CustomerWithCounts = (typeof customers)[number]

    return customers.map((customer: CustomerWithCounts) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      jobs: customer._count.jobs,
      invoices: customer._count.invoices,
      createdAt: customer.createdAt
    }))
  })

  app.get('/crm/customers/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() })
    const { id } = paramsSchema.parse(request.params)

    const customer = await app.prisma.customer.findUnique({
      where: { id },
      include: {
        jobs: true,
        quotations: true,
        invoices: true
      }
    })

    if (!customer) {
      return reply.code(404).send({ message: 'Customer not found' })
    }

    return customer
  })

  app.get('/crm/jobs', async () => {
    return app.prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        quotation: true,
        invoice: true
      }
    })
  })
}
