import express from 'express'
import cors from 'cors'
import http from 'http'
import { isEmpty, isNil, mapValues, omitBy, once } from 'lodash'
import logger from './logger'
import path from 'path'
import { loadDestination } from './destinations'
import type { DestinationDefinition } from './destinations'
import {
  Destination,
  DestinationDefinition as CloudDestinationDefinition,
  HTTPError,
  ModifiedResponse,
  JSONObject,
  AudienceDestinationDefinition
} from '@segment/actions-core'
import asyncHandler from './async-handler'
import getExchanges from './summarize-http'
import { AggregateAjvError } from '../../../ajv-human-errors/src/aggregate-ajv-error'
import { AudienceDestinationConfigurationWithCreateGet } from '@segment/actions-core/destination-kit'
interface ResponseError extends Error {
  status?: number
}

interface ErrorOutput {
  statusCode: number
  message?: string
  stack?: string[]
  requestError: true
  fields?: { [key: string]: string }
}

const marshalError = (err: Error): ErrorOutput => {
  const error = err as ResponseError
  let statusCode = error?.status ?? 500
  let msg = error?.message
  let fields: { [key: string]: string } | undefined

  if (error.name === 'AggregateAjvError') {
    fields = {}
    const ajvErr = error as AggregateAjvError
    for (const fieldError of ajvErr) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const name = fieldError.path.replace('$.', '')
      fields[name] = fieldError.message
    }
  }

  if (err instanceof HTTPError) {
    statusCode = err.response?.status ?? statusCode
    msg = ((err.response as ModifiedResponse).data as string) ?? (err.response as ModifiedResponse).content
  }

  return { statusCode, message: msg, stack: err.stack?.split('\n'), fields, requestError: true }
}

const app = express()
app.use(express.json())

app.use(
  cors({
    origin: [
      'https://app.segment.com',
      'https://eu1.app.segment.com',
      'https://app.segment.build',
      'https://eu1.app.segment.build',
      'http://localhost:8000'
    ]
  })
)

const DEFAULT_PORT = 3000
const port = parseInt(process.env.PORT ?? '', 10) || DEFAULT_PORT
const server = http.createServer(app)
const destinationSlug = process.env.DESTINATION as string
const directory = process.env.DIRECTORY as string
const entryPath = (process.env.ENTRY as string) || 'index.ts'

// For now, include the slug in the path, but when we support external repos, we'll have to change this
const targetDirectory = path.join(process.cwd(), directory, destinationSlug, entryPath)

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
  const audienceDef = destination?.definition as AudienceDestinationDefinition
  const audienceSettings = audienceDef.audienceConfig !== undefined
  const audienceConfigWithGetCreate = audienceDef.audienceConfig as AudienceDestinationConfigurationWithCreateGet
  const supportsCreateAudience = !!(audienceSettings && audienceConfigWithGetCreate.createAudience)
  const supportsGetAudience = !!(audienceSettings && audienceConfigWithGetCreate.getAudience)

  const router = express.Router()

  router.get(
    '/manifest',
    asyncHandler(async (_, res: express.Response) => {
      res.json({ ...destination.definition, directoryName: process.env.DESTINATION })
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
          const output = marshalError(err as ResponseError)
          return res.status(200).json([output])
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
          const ajvErr = error as AggregateAjvError
          for (const fieldError of ajvErr) {
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

  if (supportsCreateAudience) {
    router.post(
      '/createAudience',
      asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
          const data = await destination.createAudience(req.body)
          res.status(200).json(data)
        } catch (e) {
          const error = e as HTTPError
          const message = (await error?.response?.json()) ?? error.message
          res.status(400).json({
            ok: false,
            error: message
          })
        }
      })
    )
  }

  if (supportsGetAudience) {
    router.post(
      '/getAudience',
      asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
          const data = await destination.getAudience(req.body)
          res.status(200).json(data)
        } catch (e) {
          const error = e as HTTPError
          const message = (await error?.response?.json()) ?? error.message
          res.status(400).json({
            ok: false,
            error: message
          })
        }
      })
    )
  }

  router.post(
    '/refreshAccessToken',
    asyncHandler(async (req: express.Request, res: express.Response) => {
      try {
        const settings = {}
        const data = await destination.refreshAccessToken(settings, req.body)
        res.status(200).json({ ok: true, data })
      } catch (e) {
        const error = e as HTTPError
        const message = (await error?.response?.json()) ?? error.message
        res.status(400).json({
          ok: false,
          error: message
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

          let mapping = req.body.mapping || {}
          const fields = action.definition.fields
          const defaultMappings = omitBy(mapValues(fields, 'default'), isNil)
          mapping = { ...defaultMappings, ...mapping } as JSONObject
          if (isEmpty(mapping)) mapping = null

          const eventParams = {
            data: req.body.payload || {},
            settings: req.body.settings || {},
            audienceSettings: req.body.audienceSettings || {},
            mapping: mapping || req.body.payload || {},
            auth: req.body.auth || {}
          }

          if (Array.isArray(eventParams.data)) {
            // If no mapping or default mapping is provided, default to using the first payload across all events.
            eventParams.mapping = mapping || eventParams.data[0] || {}
            await action.executeBatch(eventParams)
          } else {
            await action.execute(eventParams)
          }

          const debug = await getExchanges(destination.responses)
          return res.status(200).json(debug)
        } catch (err) {
          const output = marshalError(err as ResponseError)
          return res.status(200).json([output])
        }
      })
    )
  }

  for (const actionSlug of Object.keys(destination.actions)) {
    const definition = destination.actions[actionSlug].definition

    if (definition.dynamicFields) {
      for (const field in definition.dynamicFields) {
        router.post(
          `/${actionSlug}/${field}`,
          asyncHandler(async (req: express.Request, res: express.Response) => {
            try {
              const data = {
                settings: req.body.settings || {},
                payload: req.body.payload || {},
                page: req.body.page || 1,
                auth: req.body.auth || {},
                audienceSettings: req.body.audienceSettings || {}
              }
              const action = destination.actions[actionSlug]
              const result = await action.executeDynamicField(field, data)

              if (result.error) {
                throw result.error
              }

              return res.status(200).json(result)
            } catch (err) {
              return res.status(500).json([err])
            }
          })
        )
      }
    }
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

  server.listen(port, '127.0.0.1', () => {
    logger.info(`Listening at http://localhost:${port} -> \n${routes.join('\n')}`)
  })
}

loadDestination(targetDirectory)
  .then(setupRoutes)
  .catch((error) => {
    logger.error(`There was an issue booting up the development server:\n\n ${error.message}`)
  })
