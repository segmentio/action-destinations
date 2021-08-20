import express from 'express'
import http from 'http'
import { once } from 'lodash'
import logger from './logger'
import path from 'path'
import { loadDestination } from './destinations'
import { Destination, CloudDestinationDefinition } from '@segment/actions-core'
import asyncHandler from './async-handler'
import getExchanges from './http'
import ora from 'ora'
import chalk from 'chalk'

const app = express()
app.use(express.json())

const spinner: ora.Ora = ora()

const port = process.env.PORT || 3000
const server = http.createServer(app)

app.post(
  '/:action',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    spinner.start(chalk`Handling ${process.env.DESTINATION} action request`)

    const directory = process.env.DIRECTORY as string
    const destinationPath = process.env.DESTINATION as string

    // For now, include the slug in the path, but when we support external repos, we'll have to change this
    const relativePath = path.join(directory, destinationPath, 'index.ts')
    const targetDirectory = path.join(process.cwd(), relativePath)

    try {
      const def = await loadDestination(targetDirectory) // loadDestinationDefinition
      const destination = new Destination(def as CloudDestinationDefinition)

      const actionSlug = req.params.action

      const action = destination.actions[actionSlug]

      if (action) {
        await action.execute({
          data: req.body.payload,
          settings: req.body.settings,
          mapping: req.body.payload,
          auth: undefined
        })

        const debug = await getExchanges(destination.responses)
        spinner.succeed(chalk`${destination.name} action '${actionSlug}' completed with some code`)
        res.status(200).json(debug)
      }
    } catch (err) {
      spinner.fail()
      res.status(err.statusCode).json(err.message)
    }
  })
)

const gracefulShutdown = once((exitCode: number) => {
  logger.info('Server stopping...')

  // Stop receiving new requests, allowing inflight requests to finish
  if (server) {
    server.close(() => {
      logger.info('Server stopped')
      // Leave time for logging / error capture
      setTimeout(() => process.exit(exitCode), 300)
    })
  }

  // Forcibly shutdown after 8 seconds (Docker forcibly kills after 10 seconds)
  setTimeout(() => {
    logger.crit('Forcibly shutting down')
    // Leave time for logging / error capture
    setTimeout(() => process.exit(1), 300)
  }, 8000)
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleUncaught(error: any, crashType: string): void {
  error.crashType = crashType
  logger.crit('😱  Server crashed', error)

  // Gracefully shutdown the server on uncaught errors to allow inflight requests to finish
  gracefulShutdown(1)
}

process.on('uncaughtException', (error) => {
  handleUncaught(error, 'uncaughtException')
})
process.on('unhandledRejection', (error) => {
  handleUncaught(error, 'unhandledRejection')
})

// Termination signal sent by Docker on stop
process.on('SIGTERM', () => gracefulShutdown(0))
// Interrupt signal sent by Ctrl+C
process.on('SIGINT', () => gracefulShutdown(0))

server.on('error', (err: Error) => {
  logger.error(`Server error: ${err.message}`, err)
})

server.listen(port, () => {
  logger.info(`Listening at http://localhost:${port}`)
})
