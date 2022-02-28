import express from 'express'
import cors from 'cors'
import http from 'http'
import { once } from 'lodash'
import logger from './logger'
import path from 'path'
import { loadDestination } from './destinations'
import type { DestinationDefinition } from './destinations'
import {
  Destination,
  DestinationDefinition as CloudDestinationDefinition,
  HTTPError,
  ModifiedResponse
} from '@segment/actions-core'
import asyncHandler from './async-handler'
import getExchanges from './summarize-http'
interface ResponseError extends Error {
  status?: number
}

const app = express()
app.use(express.json())
app.use(
  cors({
    origin: ['https://app.segment.build', 'https://app.segment.com', 'http://localhost:8000']
  })
)

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

app.use((req, res, next) => {
  const requestStartedAt = process.hrtime.bigint()
  const routePath = req.path
  const endpoint = `${req.method} ${routePath}`

  const afterResponse = () => {
    res.removeListener('finish', afterResponse)
    res.removeListener('close', afterResponse)

    const requestEndedAt = process.hrtime.bigint()
    const duration = Number(requestEndedAt - requestStartedAt) / 1000000
    const statusCode = res.statusCode

    if (statusCode >= 500) {
      logger.error(`🚨  ${statusCode} ${endpoint} - ${Math.round(duration)}ms`)
    } else {
      logger.info(`💬  ${statusCode} ${endpoint} - ${Math.round(duration)}ms`)
    }
  }

  res.once('finish', afterResponse)
  res.once('close', afterResponse)
  next()
})

function setupRoutes(def: DestinationDefinition | null): void {
  const destination = new Destination(def as CloudDestinationDefinition)
  const supportsDelete = destination.onDelete

  const router = express.Router()

  router.get(
    '/manifest',
    asyncHandler(async (req: express.Request, res: express.Response) => {
      res.json(destination.definition)
    })
  )

  if (supportsDelete) {
    router.post(
      '/delete',
      asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
          if (destination.onDelete) {
            await destination.onDelete(req.body.payload ?? {}, req.body.settings ?? {})
          }

          const debug = await getExchanges(destination.responses)
          return res.status(200).json(debug)
        } catch (err) {
          const error = err as ResponseError
          let statusCode = error?.status ?? 500
          let msg = error?.message

          if (err instanceof HTTPError) {
            statusCode = err.response?.status ?? statusCode
            msg = ((err.response as ModifiedResponse).data as string) ?? (err.response as ModifiedResponse).content
          }

          return res.status(statusCode).send(msg + '<br/>' + error.stack?.split('\n').join('<br/>'))
        }
      })
    )
  }

  router.post(
    '/authenticate',
    asyncHandler(async (req: express.Request, res: express.Response) => {
      try {
        await destination.testAuthentication(req.body)
        res.status(200).json({ ok: true })
      } catch (e) {
        const error = e as ResponseError
        const fields: Record<string, string> = {}

        if (error.name === 'AggregateAjvError') {
          for (const fieldError of error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const name = fieldError.path.replace('$.', '')
            fields[name] = fieldError.message
          }
        }

        res.status(200).json({
          ok: false,
          error: error.message,
          fields
        })
      }
    })
  )

  for (const actionSlug of Object.keys(destination.actions)) {
    router.post(
      `/${actionSlug}`,
      asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
          const action = destination.actions[actionSlug]

          if (!action) {
            const msg = `${destination.name} action '${actionSlug}' is invalid or not found`
            return res.status(400).send(msg)
          }

          const eventParams = {
            data: req.body.payload || {},
            settings: req.body.settings || {},
            mapping: req.body.payload || {},
            auth: req.body.auth || {}
          }

          if (Array.isArray(eventParams.data)) {
            // We assume that the the first payload in the data array
            // provided for testing contains all actions mappings
            eventParams.mapping = eventParams.data[0] || {}
            await action.executeBatch(eventParams)
          } else {
            await action.execute(eventParams)
          }

          const debug = await getExchanges(destination.responses)
          return res.status(200).json(debug)
        } catch (err) {
          const error = err as ResponseError
          let statusCode = error?.status ?? 500
          let msg = error?.message ?? ''

          if (err instanceof HTTPError) {
            statusCode = err?.response?.status ?? statusCode
            msg = ((err.response as ModifiedResponse).data as string) ?? (err.response as ModifiedResponse).content
          }

          return res.status(statusCode).send(msg)
        }
      })
    )
  }

  app.use(router)

  // Construct a list of all the available routes to stdout
  const routes: string[] = []
  for (const r of router.stack) {
    for (const [m, enabled] of Object.entries(r.route.methods)) {
      if (enabled && r.route.path !== '/manifest') {
        routes.push(`  ${m.toUpperCase()} ${r.route.path}`)
      }
    }
  }

  server.listen(port, () => {
    logger.info(`Listening at http://localhost:${port} -> \n${routes.join('\n')}`)
  })
}

loadDestination(targetDirectory)
  .then(setupRoutes)
  .catch((error) => {
    logger.error(`There was an issue booting up the development server:\n\n ${error.message}`)
  })
