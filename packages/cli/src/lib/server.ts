import express from 'express'
import http from 'http'
import { once } from 'lodash'
import logger from './logger'
import path from 'path'
import { loadDestination } from './destinations'
import { Destination, DestinationDefinition as CloudDestinationDefinition } from '@segment/actions-core'
import asyncHandler from './async-handler'
import getExchanges from './summarize-http'
import ora from 'ora'
import chalk from 'chalk'
import { HTTPError } from '@segment/actions-core/request-client'
import type { ModifiedResponse } from '@segment/actions-core/types'

const app = express()
app.use(express.json())

const spinner: ora.Ora = ora()

const DEFAULT_PORT = 3000
const port = process.env.PORT || DEFAULT_PORT
const server = http.createServer(app)
const destinationSlug = process.env.DESTINATION as string
const directory = process.env.DIRECTORY as string

// For now, include the slug in the path, but when we support external repos, we'll have to change this
const targetDirectory = path.join(process.cwd(), directory, destinationSlug, 'index.ts')

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

// Interrupt signal sent by Ctrl+C
process.on('SIGINT', () => gracefulShutdown(0))

server.on('error', (err: Error) => {
  logger.error(`Server error: ${err.message}`, err)
})

loadDestination(targetDirectory)
  .then((def) => {
    app.post(
      '/:action',
      asyncHandler(async (req: express.Request, res: express.Response) => {
        const actionSlug = req.params.action

        spinner.start(chalk`Handling ${process.env.DESTINATION}#${actionSlug} action request`)

        try {
          const destination = new Destination(def as CloudDestinationDefinition)
          const action = destination.actions[actionSlug]

          if (!action) {
            const msg = `${destination.name} action '${actionSlug}' is invalid or not found`
            spinner.fail(chalk`${msg}`)
            return res.status(400).send(msg)
          }

          await action.execute({
            data: req.body.payload || {},
            settings: req.body.settings || {},
            mapping: req.body.payload || {},
            auth: req.body.auth || {}
          })

          const debug = await getExchanges(destination.responses)
          spinner.succeed(chalk`${destination.name} action '${actionSlug}' completed`)
          return res.status(200).json(debug)
        } catch (err) {
          spinner.fail()
          let statusCode = err?.status ?? 500
          let msg = err?.message

          if (err instanceof HTTPError) {
            statusCode = err?.response?.status ?? statusCode
            msg = (err.response as ModifiedResponse).data ?? (err.response as ModifiedResponse).content
          }

          return res.status(statusCode).send(msg)
        }
      })
    )

    server.listen(port, () => {
      logger.info(`Listening at http://localhost:${port} -> 
${Object.keys(def?.actions ?? {})
  .map((action) => `  POST http://localhost:${port}/${action}`)
  .join('\n')}`)
    })
  })
  .catch((error) => {
    logger.error(`There was an issue booting up the development server:\n\n ${error.message}`)
  })
