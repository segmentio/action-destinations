// @ts-ignore no types
import { AggregateAjvError } from '@segment/ajv-human-errors'
import Ajv from 'ajv'
import dayjs from 'dayjs'
import { EventEmitter } from 'events'
import NodeCache from 'node-cache'
import createRequestClient from '../create-request-client'
import { get } from '../get'
import { JSONLikeObject, JSONObject } from '../json-object'
import { transform } from '../mapping-kit'
import { fieldsToJsonSchema } from './fields-to-jsonschema'
import { Response } from '../fetch'
import { ExecuteInput, Step, StepResult, Steps } from './step'
import type { ModifiedResponse } from '../types'
import type { DynamicFieldResponse, InputField, RequestExtension } from './types'

type MaybePromise<T> = T | Promise<T>
type RequestClient = ReturnType<typeof createRequestClient>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestFn<Settings, Payload, Return = any> = (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload>
) => MaybePromise<Return>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ActionDefinition<Settings, Payload = any> {
  /** The unique identifier for the action, e.g. `postToChannel` */
  // key: string

  /** The display title of the action */
  title: string

  /** The display description of the action */
  description: string

  /** An optional fql query that will be used to prepopulate the action when it is first set up */
  defaultSubscription?: string

  /** Whether or not this action should be visible/configurable in the UI */
  hidden?: boolean

  /**
   * The fields used to perform the action. These fields should match what the partner API expects.
   */
  fields: Record<string, InputField>

  /**
   * A way to "register" dynamic fields.
   * This is likely going to change as we productionalize the data model and definition object
   */
  dynamicFields?: {
    [K in keyof Payload]?: RequestFn<Settings, Payload, DynamicFieldResponse>
  }

  /**
   * Register fields that should be executed, cached and provided
   * to the action's `perform` function
   */
  cachedFields?: {
    [field: string]: {
      key: (data: ExecuteInput<Settings, Payload>) => string
      ttl: number
      value: RequestFn<Settings, Payload>
      negative?: boolean
    }
  }

  /** The operation to perform when this action is triggered */
  perform: RequestFn<Settings, Payload>
}

class MapInput<Settings, Payload extends JSONLikeObject> extends Step<Settings, Payload> {
  executeStep(data: ExecuteInput<Settings, Payload>): Promise<string> {
    // Transforms the initial payload (event) + action settings (from `subscriptions[0].mapping`)
    // into input data that the action can use to talk to partner apis
    if (data.mapping) {
      // Technically we can't know whether or not `transform` returns the exact shape of Payload here, hence the casting
      // It will be validated in subsequent steps
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.payload = transform(data.mapping, data.payload as any) as Payload
    }

    return Promise.resolve('MapInput completed')
  }
}

const ajv = new Ajv({
  // Coerce types to be a bit more liberal.
  coerceTypes: true,
  // Return all validation errors, not just the first.
  allErrors: true,
  // Include reference to schema and data in error values.
  verbose: true,
  // Remove properties not defined the schema object
  removeAdditional: true,
  // Use a more parse-able format for JSON paths.
  jsonPointers: true
})

// Extend with additional supported formats
ajv.addFormat('password', () => true)
ajv.addFormat('text', () => true)
ajv.addFormat('date-like', (data: string) => {
  let date = dayjs(data)

  if (String(Number(data)) === data) {
    // parse as unix
    if (data.length === 13) {
      date = dayjs(Number(data))
    }

    date = dayjs.unix(Number(data))
  }

  return date.isValid()
})

export class Validate<Settings, Payload> extends Step<Settings, Payload> {
  field: ExecuteInputField
  validate: Ajv.ValidateFunction

  constructor(field: ExecuteInputField, schema: object) {
    super()
    this.field = field
    this.validate = ajv.compile(schema)
  }

  executeStep(data: ExecuteInput<Settings, Payload>): Promise<string> {
    if (!this.validate(data[this.field])) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      throw new AggregateAjvError(this.validate.errors)
    }

    return Promise.resolve('Validate completed')
  }
}

/**
 * Request handles delivering a payload to an external API. It uses the `fetch` API under the hood.
 *
 * The callback should be able to return the raw request instead of needing to do `return response.data` etc.
 */
class Request<Settings, Payload> extends Step<Settings, Payload> {
  requestFn: RequestFn<Settings, Payload> | undefined
  extendRequest: RequestExtension<Settings, Payload> | undefined

  constructor(
    extendRequest: RequestExtension<Settings, Payload> | undefined,
    requestFn?: RequestFn<Settings, Payload>
  ) {
    super()
    this.extendRequest = extendRequest
    this.requestFn = requestFn
  }

  async executeStep(data: ExecuteInput<Settings, Payload>): Promise<JSONObject | string | null | undefined> {
    if (!this.requestFn) {
      return ''
    }

    const requestClient = this.createRequestClient(data)

    const response = await this.requestFn(requestClient, data)

    /**
     * Try to use the parsed response `.data` or `.content` string
     * @see {@link ../middleware/after-response/prepare-response.ts}
     */
    if (response instanceof Response) {
      return ((response as ModifiedResponse).data as JSONObject) ?? (response as ModifiedResponse).content
    }

    // otherwise, we don't really know what this is, so return as-is
    return response
  }

  protected createRequestClient(data: ExecuteInput<Settings, Payload>): RequestClient {
    // TODO turn `extendRequest` into a beforeRequest hook
    const options = this.extendRequest?.(data) ?? {}
    const client = createRequestClient(options, {
      afterResponse: [
        // Keep track of the request(s) associated with a response
        (request, options, response) => {
          // TODO figure out the types here...
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const modifiedResponse: any = response
          modifiedResponse.request = request
          modifiedResponse.options = options

          this.emit('response', modifiedResponse)

          return modifiedResponse
        }
      ]
    })
    return client
  }
}

interface CachedRequestConfig<Settings, Payload> {
  key: (data: ExecuteInput<Settings, Payload>) => string
  value: RequestFn<Settings, Payload>
  as: string
  ttl: number
  negative?: boolean
}

// CachedRequest is like Request but cached. Next question.
class CachedRequest<Settings, Payload> extends Request<Settings, Payload> {
  keyFn: Function
  valueFn: Function
  as: string
  negative: boolean
  cache: NodeCache

  constructor(
    extension: RequestExtension<Settings, Payload> | undefined,
    config: CachedRequestConfig<Settings, Payload>
  ) {
    super(extension)

    this.keyFn = config.key
    this.valueFn = config.value
    this.as = config.as
    this.negative = config.negative || false

    this.cache = new NodeCache({
      stdTTL: config.ttl,
      maxKeys: 1000
    })
  }

  async executeStep(data: ExecuteInput<Settings, Payload>): Promise<string> {
    const k = this.keyFn(data)
    let v = this.cache.get<string>(k)

    if (v !== undefined) {
      data.cachedFields[this.as] = v
      return 'cache hit'
    }

    const request = this.createRequestClient(data)

    try {
      v = await this.valueFn(request, data)
    } catch (e) {
      if (get(e, 'response.status') === 404) {
        v = undefined
      } else {
        throw e
      }
    }

    // Only cache if value is not negative *or* negative option is set. Negative caching is off by
    // default because the common cases are: A) auth token generation, which should never be
    // negative, and B) create-or-update patterns, where the resource should exist after the first
    // negative value.
    if ((v !== null && v !== undefined) || this.negative) {
      this.cache.set(k, v)
    }

    return 'cache miss'
  }
}

interface ExecuteDynamicFieldInput<Settings, Payload> {
  settings: Settings
  payload: Payload
  cachedFields: { [key: string]: string }
  page?: string
}

type ExecuteInputField = 'payload' | 'settings'

/**
 * Action is the beginning step for all partner actions. Entrypoints always start with the
 * MapAndValidateInput step.
 */
export class Action<Settings, Payload extends JSONLikeObject> extends EventEmitter {
  readonly steps: Steps<Settings, Payload>
  private extendRequest: RequestExtension<Settings, Payload> | undefined
  private dynamicFieldCache: { [key: string]: RequestFn<Settings, Payload> }

  constructor(definition: ActionDefinition<Settings, Payload>, extendRequest?: RequestExtension<Settings, Payload>) {
    super()

    this.steps = new Steps()
    const step = new MapInput<Settings, Payload>()
    this.steps.push(step)

    this.dynamicFieldCache = {}

    if (extendRequest) {
      // This must come before we load the definition because
      // it instantiates "steps" with whatever request extensions
      // are defined at that moment in time
      this.extendRequest = extendRequest
    }

    this.loadDefinition(definition)
  }

  async execute(data: ExecuteInput<Settings, Payload>): Promise<StepResult[]> {
    const results = await this.steps.execute(data)

    const finalResult = results[results.length - 1]
    if (finalResult.error) {
      throw finalResult.error
    }

    return results
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeDynamicField(field: string, data: ExecuteDynamicFieldInput<Settings, Payload>): any {
    if (!this.dynamicFieldCache[field]) {
      return {
        data: [],
        pagination: {}
      }
    }

    const step = new Request<Settings, Payload>(this.extendRequest, this.dynamicFieldCache[field])

    return step.executeStep(data)
  }

  private loadDefinition(definition: ActionDefinition<Settings, Payload>): void {
    if (definition.fields) {
      this.validatePayload(definition.fields)
    }

    Object.entries(definition.dynamicFields ?? {}).forEach(([field, callback]) => {
      this.dynamicField(field, callback as RequestFn<Settings, Payload>)
    })

    Object.entries(definition.cachedFields ?? {}).forEach(([field, cacheConfig]) => {
      this.cachedRequest({
        ...cacheConfig,
        as: field
      })
    })

    if (definition.perform) {
      this.request(definition.perform)
    }
  }

  private validatePayload(fields: Record<string, InputField>): void {
    const step = new Validate('payload', fieldsToJsonSchema(fields))
    this.steps.push(step)
  }

  private dynamicField(field: string, callback: RequestFn<Settings, Payload>): void {
    this.dynamicFieldCache[field] = callback
  }

  private request(requestFn: RequestFn<Settings, Payload>): void {
    const step = new Request<Settings, Payload>(this.extendRequest, requestFn)
    step.on('response', (response) => this.emit('response', response))
    this.steps.push(step)
  }

  private cachedRequest(config: CachedRequestConfig<Settings, Payload>): void {
    const step = new CachedRequest(this.extendRequest, config)
    this.steps.push(step)
  }
}
