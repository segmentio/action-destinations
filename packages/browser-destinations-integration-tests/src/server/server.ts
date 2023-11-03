import express from 'express'
import { Server } from 'http'

const onExit = (server: Server) => {
  return (): void => {
    console.log('closing server...')
    server.close(() => {
      console.log('closed gracefully!')
      process.exit()
    })
    setTimeout(() => {
      console.log('Force closing!')
      process.exit(1)
    }, 400)
  }
}
export const startServer = (port: string | number): Promise<[express.Application, Server]> => {
  if (!port) {
    throw new Error('please pass a PORT')
  }
  return new Promise((resolve) => {
    const app = express()
    const server = app.listen(port, () => {
      console.log(`Listening on http://localhost:${port} in ${app.get('env')}`)
      resolve([app, server])
    })
    process.on('SIGINT', onExit(server))
    process.on('SIGTERM', onExit(server))
  })
}
