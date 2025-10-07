import type { FastifyInstance } from 'fastify'

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard/summary', async () => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [payments, pendingJobs, inProgressJobs, completedJobs, newCustomers, recentMessages] = await Promise.all([
      app.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { receivedAt: { gte: startOfDay } }
      }),
      app.prisma.job.count({ where: { status: 'PENDING' } }),
      app.prisma.job.count({ where: { status: 'IN_PROGRESS' } }),
      app.prisma.job.count({ where: { status: 'COMPLETED' } }),
      app.prisma.customer.count({ where: { createdAt: { gte: startOfDay } } }),
      app.prisma.messageLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { customer: true }
      })
    ])

    const revenue = payments._sum.amount ? Number(payments._sum.amount) : 0
    type MessageWithCustomer = (typeof recentMessages)[number]

    return {
      revenue,
      jobs: {
        pending: pendingJobs,
        inProgress: inProgressJobs,
        completed: completedJobs
      },
      customers: {
        newToday: newCustomers
      },
      recentMessages: recentMessages.map((message: MessageWithCustomer) => ({
        id: message.id,
        customer: {
          id: message.customer.id,
          name: message.customer.name,
          phone: message.customer.phone
        },
        direction: message.direction,
        content: message.content,
        createdAt: message.createdAt
      }))
    }
  })
}
