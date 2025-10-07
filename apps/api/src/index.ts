import { buildServer } from './server.js'
import { serverConfig } from './env.js'

async function main() {
  const app = await buildServer()
  await app.listen({ port: serverConfig.port, host: serverConfig.host })
  app.log.info(`API listening on http://${serverConfig.host}:${serverConfig.port}`)
}

main().catch((error) => {
  console.error('Failed to start API server', error)
  process.exit(1)
})
