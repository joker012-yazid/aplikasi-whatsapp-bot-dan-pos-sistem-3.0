import { Queue } from 'bullmq'
import { redis } from './redis.js'

export const QUEUE_NAMES = {
  concierge: 'concierge-messages',
  quotation: 'quotation-followups',
  notifications: 'notification-outbox'
} as const

type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]

export interface AppQueues {
  concierge: Queue
  quotation: Queue
  notifications: Queue
}

export const createQueues = (): AppQueues => {
  const concierge = new Queue(QUEUE_NAMES.concierge, { connection: redis })
  const quotation = new Queue(QUEUE_NAMES.quotation, { connection: redis })
  const notifications = new Queue(QUEUE_NAMES.notifications, { connection: redis })

  return { concierge, quotation, notifications }
}

export type { QueueName }
