import makeWASocket, {
  DisconnectReason,
  WASocket,
  Browsers,
  useMultiFileAuthState,
  WAMessageContent,
  WAMessageKey
} from '@adiwajshing/baileys'
import type { PrismaClient } from '@prisma/client'
import EventEmitter from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import pino from 'pino'

export type SessionEventMap = {
  'session.qr': { sessionId: string; qr: string }
  'session.connected': { sessionId: string }
  'session.disconnected': { sessionId: string; reason?: string }
  'session.message': { sessionId: string; key: WAMessageKey; message: WAMessageContent }
}

export interface SessionManagerEvents {
  on<T extends keyof SessionEventMap>(event: T, listener: (payload: SessionEventMap[T]) => void): this
  off<T extends keyof SessionEventMap>(event: T, listener: (payload: SessionEventMap[T]) => void): this
  emit<T extends keyof SessionEventMap>(event: T, payload: SessionEventMap[T]): boolean
}

type ManagedSession = {
  socket: WASocket
  saveCreds: () => Promise<void>
  qr?: string
}

export interface SessionManagerOptions {
  prisma: PrismaClient
  baseDir?: string
  logger?: pino.Logger
}

export class BaileysSessionManager extends (EventEmitter as new () => EventEmitter & SessionManagerEvents) {
  private readonly sessions = new Map<string, ManagedSession>()
  private readonly baseDir: string
  private readonly prisma: PrismaClient
  private readonly logger: pino.Logger

  constructor(options: SessionManagerOptions) {
    super()
    this.prisma = options.prisma
    this.baseDir = options.baseDir ?? './storage/sessions'
    this.logger = options.logger ?? pino({ name: 'baileys', level: process.env.LOG_LEVEL ?? 'info' })
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true })
    }
  }

  async getOrCreateSession(sessionId: string): Promise<ManagedSession> {
    const existing = this.sessions.get(sessionId)
    if (existing) {
      return existing
    }

    const sessionPath = path.resolve(this.baseDir, sessionId)
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
    const socketLogger = this.logger.child({ module: 'baileys-socket', sessionId })
    const socket = makeWASocket({
      auth: state,
      browser: Browsers.macOS('Voltura Service Hub'),
      markOnlineOnConnect: false,
      printQRInTerminal: false,
      logger: socketLogger as any
    })

    socket.ev.on('creds.update', saveCreds)
    socket.ev.on('connection.update', async (update) => {
      if (update.qr) {
        this.logger.info({ sessionId }, 'received QR for session')
        this.sessions.set(sessionId, { socket, saveCreds, qr: update.qr })
        this.logger.info({ sessionId }, 'session connected')
        await this.prisma.whatsAppSession.upsert({
          where: { id: sessionId },
          update: { qrCode: update.qr, status: 'qr' },
          create: { id: sessionId, name: sessionId, status: 'qr', qrCode: update.qr }
        })
        this.emit('session.qr', { sessionId, qr: update.qr })
        return
      }

      if (update.connection === 'open') {
        await this.prisma.whatsAppSession.upsert({
          where: { id: sessionId },
          update: { status: 'connected', qrCode: null, lastSyncedAt: new Date() },
          create: { id: sessionId, name: sessionId, status: 'connected', lastSyncedAt: new Date() }
        })
        this.sessions.set(sessionId, { socket, saveCreds })
        this.emit('session.connected', { sessionId })
      }

      if (update.connection === 'close') {
        const reason = update.lastDisconnect?.error?.message ?? 'unknown'
        this.logger.warn({ sessionId, reason }, 'session disconnected')
        const status = (update.lastDisconnect?.error as any)?.output?.statusCode
        if (status === DisconnectReason.loggedOut) {
          await this.prisma.whatsAppSession.update({
            where: { id: sessionId },
            data: { status: 'logged_out', qrCode: null }
          })
        } else {
          await this.prisma.whatsAppSession.update({
            where: { id: sessionId },
            data: { status: 'disconnected' }
          })
        }
        this.sessions.delete(sessionId)
        this.emit('session.disconnected', { sessionId, reason })
      }
    })

    socket.ev.on('messages.upsert', async ({ messages }) => {
      for (const message of messages) {
        const remoteJid = message.key.remoteJid
        if (!remoteJid) continue
        const phone = remoteJid.replace(/@.*/, '')
        const customer = await this.prisma.customer.upsert({
          where: { phone },
          update: { updatedAt: new Date() },
          create: { phone, name: phone }
        })
        await this.prisma.messageLog.create({
          data: {
            customerId: customer.id,
            sessionId,
            direction: message.key.fromMe ? 'OUTBOUND' : 'INBOUND',
            content: message.message?.conversation ?? '[non-text message]'
          }
        })
        this.emit('session.message', {
          sessionId,
          key: message.key,
          message: message.message
        })
      }
    })

    const managed: ManagedSession = { socket, saveCreds }
    this.sessions.set(sessionId, managed)
    return managed
  }

  async getSessionStatus(sessionId: string) {
    const session = await this.prisma.whatsAppSession.findUnique({ where: { id: sessionId } })
    const managed = this.sessions.get(sessionId)
    return {
      id: sessionId,
      status: session?.status ?? 'disconnected',
      qr: managed?.qr ?? session?.qrCode ?? null,
      lastSyncedAt: session?.lastSyncedAt ?? null
    }
  }

  async sendTextMessage(sessionId: string, jid: string, text: string) {
    const { socket } = await this.getOrCreateSession(sessionId)
    await socket.sendMessage(jid, { text })
  }

  async terminate(sessionId: string) {
    const managed = this.sessions.get(sessionId)
    if (managed) {
      managed.socket.ws.close()
      this.sessions.delete(sessionId)
    }
    await this.prisma.whatsAppSession.updateMany({
      where: { id: sessionId },
      data: { status: 'disconnected', qrCode: null }
    })
  }
}
