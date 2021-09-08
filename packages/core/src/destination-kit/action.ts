import { EventEmitter } from 'events'
import createRequestClient from '../create-request-client'
import { JSONLikeObject, JSONObject } from '../json-object'
import { InputData, transform, transformBatch } from '../mapping-kit'
import { fieldsToJsonSchema } from './fields-to-jsonschema'
import { Response } from '../fetch'
import type { ModifiedResponse } from '../types'
import type { DynamicFieldResponse, InputField, RequestExtension, ExecuteInput, Result } from './types'
import type { NormalizedOptions } from '../request-client'
import type { JSONSchema4 } from 'json-schema'
import { validateSchema } from '../schema-validation'
import { AuthTokens } from './parse-settings'

type MaybePromise<T> = T | Promise<T>
type RequestClient = ReturnType<typeof createRequestClient>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestFn<Settings, Payload, Return = any> = (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload>
) => MaybePromise<Return>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BaseActionDefinition {
  /** The display title of the action */
  title: string

  /** The display description of the action */
  description: string

  /**
   * The target platform for the action
   * @default 'cloud'
   */
  platform?: 'cloud' | 'web'

  /** An optional fql query that will be used to prepopulate the action when it is first set up */
  defaultSubscription?: string

  /** Whether or not this action should be visible/configurable in the UI */
  hidden?: boolean

  /**
   * The fields used to perform the action. These fields should match what the partner API expects.
   */
  fields: Record<string, InputField>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ActionDefinition<Settings, Payload = any> extends BaseActionDefinition {
  /**
   * A way to "register" dynamic fields.
   * This is likely going to change as we productionalize the data model and definition object
   */
  dynamicFields?: {
    [K in keyof Payload]?: RequestFn<Settings, Payload, DynamicFieldResponse>
  }

  /** The operation to perform when this action is triggered */
  perform: RequestFn<Settings, Payload>

  /** The operation to perform when this action is triggered for a batch of events */
  performBatch?: RequestFn<Settings, Payload[]>
}

interface ExecuteDynamicFieldInput<Settings, Payload> {
  settings: Settings
  payload: Payload
  page?: string
}

interface ExecuteBundle<T = unknown, Data = unknown> {
  data: Data
  settings: T
  mapping: JSONObject
  auth: AuthTokens | undefined
}

/**
 * Action is the beginning step for all partner actions. Entrypoints always start with the
 * MapAndValidateInput step.
 */
export class Action<Settings, Payload extends JSONLikeObject> extends EventEmitter {
  readonly definition: ActionDefinition<Settings, Payload>
  readonly destinationName: string
  readonly schema?: JSONSchema4
  private extendRequest: RequestExtension<Settings> | undefined

  constructor(
    destinationName: string,
    definition: ActionDefinition<Settings, Payload>,
    extendRequest?: RequestExtension<Settings>
  ) {
    super()
    this.definition = definition
    this.destinationName = destinationName
    this.extendRequest = extendRequest

    // Generate json schema based on the field definitions
    if (Object.keys(definition.fields ?? {}).length) {
      this.schema = fieldsToJsonSchema(definition.fields)
    }
  }

  async execute(bundle: ExecuteBundle<Settings, InputData | undefined>): Promise<Result[]> {
    // TODO cleanup results... not sure it's even used
    const results: Result[] = []

    // Resolve/transform the mapping with the input data
    const payload = transform(bundle.mapping, bundle.data) as Payload
    results.push({ output: 'Mappings resolved' })

    // Validate the resolved payload against the schema
    if (this.schema) {
      validateSchema(payload, this.schema, `${this.destinationName}:${this.definition.title}`)
      results.push({ output: 'Payload validated' })
    }

    // Construct the data bundle to send to an action
    const dataBundle = {
      rawData: bundle.data,
      rawMapping: bundle.mapping,
      settings: bundle.settings,
      payload,
      auth: bundle.auth
    }

    // Construct the request client and perform the action
    const output = await this.performRequest(this.definition.perform, dataBundle)
    results.push({ output: output as JSONObject })

    return results
  }

  async executeBatch(bundle: ExecuteBundle<Settings, InputData[]>): Promise<void> {
    const payloads = transformBatch(bundle.mapping, bundle.data) as Payload[]

    // Validate the resolved payloads against the schema
    if (this.schema) {
      const schemaKey = `${this.destinationName}:${this.definition.title}`
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      payloads.map((payload) => validateSchema(payload, this.schema!, schemaKey))
    }

    if (this.definition.performBatch) {
      const data = {
        rawData: bundle.data,
        rawMapping: bundle.mapping,
        settings: bundle.settings,
        payload: payloads,
        auth: bundle.auth
      }
      await this.performRequest(this.definition.performBatch, data)
      return
    }

    const promises = payloads.map((payload, i) => {
      const data = {
        rawData: bundle.data[i],
        rawMapping: bundle.mapping,
        settings: bundle.settings,
        payload,
        auth: bundle.auth
      }
      return this.performRequest(this.definition.perform, data)
    })

    await Promise.all(promises)
  }

  executeDynamicField(field: string, data: ExecuteDynamicFieldInput<Settings, Payload>): unknown {
    const fn = this.definition.dynamicFields?.[field]
    if (typeof fn !== 'function') {
      return {
        data: [],
        pagination: {}
      }
    }

    return this.performRequest(fn, data)
  }

  /**
   * Perform a request using the definition's request client
   * the given request function
   * and given data bundle
   */
  private async performRequest<T extends Payload | Payload[]>(
    requestFn: RequestFn<Settings, T>,
    data: ExecuteInput<Settings, T>
  ): Promise<unknown> {
    const requestClient = this.createRequestClient(data)
    const response = await requestFn(requestClient, data)
    return this.parseResponse(response)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createRequestClient(data: ExecuteInput<Settings, any>): RequestClient {
    // TODO turn `extendRequest` into a beforeRequest hook
    const options = this.extendRequest?.(data) ?? {}
    return createRequestClient(options, {
      afterResponse: [this.afterResponse.bind(this)]
    })
  }

  // Keep track of the request(s) associated with a response
  private afterResponse(request: Request, options: NormalizedOptions, response: Response) {
    // TODO figure out the types here...
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modifiedResponse: any = response
    modifiedResponse.request = request
    modifiedResponse.options = options

    this.emit('response', modifiedResponse)
    return modifiedResponse
  }

  private parseResponse(response: unknown): unknown {
    /**
     * Try to use the parsed response `.data` or `.content` string
     * @see {@link ../middleware/after-response/prepare-response.ts}
     */
    if (response instanceof Response) {
      return (response as ModifiedResponse).data ?? (response as ModifiedResponse).content
    }

    // otherwise, we don't really know what this is, so return as-is
    return response
  }
}
