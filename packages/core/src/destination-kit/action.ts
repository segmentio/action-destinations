import { EventEmitter } from 'events'
import createRequestClient from '../create-request-client'
import { JSONLikeObject, JSONObject } from '../json-object'
import { InputData, Features, transform, transformBatch } from '../mapping-kit'
import { fieldsToJsonSchema } from './fields-to-jsonschema'
import { Response } from '../fetch'
import type { ModifiedResponse } from '../types'
import type { DynamicFieldResponse, InputField, RequestExtension, ExecuteInput, Result } from './types'
import { NormalizedOptions } from '../request-client'
import type { JSONSchema4 } from 'json-schema'
import { validateSchema } from '../schema-validation'
import { AuthTokens } from './parse-settings'
import { IntegrationError } from '../errors'
import { removeEmptyValues } from '../remove-empty-values'
import { Logger, StatsContext, TransactionContext, StateContext } from './index'

type MaybePromise<T> = T | Promise<T>
type RequestClient = ReturnType<typeof createRequestClient>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestFn<Settings, Payload, Return = any, AudienceSettings = any> = (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload, AudienceSettings>
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
export interface ActionDefinition<Settings, Payload = any, AudienceSettings = any> extends BaseActionDefinition {
  /**
   * A way to "register" dynamic fields.
   * This is likely going to change as we productionalize the data model and definition object
   */
  dynamicFields?: {
    [K in keyof Payload]?: RequestFn<Settings, Payload, DynamicFieldResponse, AudienceSettings>
  }

  /** The operation to perform when this action is triggered */
  perform: RequestFn<Settings, Payload, any, AudienceSettings>

  /** The operation to perform when this action is triggered for a batch of events */
  performBatch?: RequestFn<Settings, Payload[], any, AudienceSettings>
}

export interface ExecuteDynamicFieldInput<Settings, Payload, AudienceSettings = any> {
  settings: Settings
  audienceSettings?: AudienceSettings
  payload: Payload
  page?: string
  auth?: AuthTokens
}

interface ExecuteBundle<T = unknown, Data = unknown, AudienceSettings = any> {
  data: Data
  settings: T
  audienceSettings?: AudienceSettings
  mapping: JSONObject
  auth: AuthTokens | undefined
  /** For internal Segment/Twilio use only. */
  features?: Features | undefined
  statsContext?: StatsContext | undefined
  logger?: Logger | undefined
  transactionContext?: TransactionContext
  stateContext?: StateContext
}

/**
 * Action is the beginning step for all partner actions. Entrypoints always start with the
 * MapAndValidateInput step.
 */
export class Action<Settings, Payload extends JSONLikeObject, AudienceSettings = any> extends EventEmitter {
  readonly definition: ActionDefinition<Settings, Payload, AudienceSettings>
  readonly destinationName: string
  readonly schema?: JSONSchema4
  readonly hasBatchSupport: boolean
  // Payloads may be any type so we use `any` explicitly here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extendRequest: RequestExtension<Settings, any> | undefined

  constructor(
    destinationName: string,
    definition: ActionDefinition<Settings, Payload, AudienceSettings>,
    // Payloads may be any type so we use `any` explicitly here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extendRequest?: RequestExtension<Settings, any>
  ) {
    super()
    this.definition = definition
    this.destinationName = destinationName
    this.extendRequest = extendRequest
    this.hasBatchSupport = typeof definition.performBatch === 'function'

    // Generate json schema based on the field definitions
    if (Object.keys(definition.fields ?? {}).length) {
      this.schema = fieldsToJsonSchema(definition.fields)
    }
  }

  async execute(bundle: ExecuteBundle<Settings, InputData | undefined, AudienceSettings>): Promise<Result[]> {
    // TODO cleanup results... not sure it's even used
    const results: Result[] = []

    // Resolve/transform the mapping with the input data
    let payload = transform(bundle.mapping, bundle.data) as Payload
    results.push({ output: 'Mappings resolved' })

    // Remove empty values (`null`, `undefined`, `''`) when not explicitly accepted
    payload = removeEmptyValues(payload, this.schema, true) as Payload

    // Validate the resolved payload against the schema
    if (this.schema) {
      const schemaKey = `${this.destinationName}:${this.definition.title}`
      validateSchema(payload, this.schema, { schemaKey, statsContext: bundle.statsContext })
      results.push({ output: 'Payload validated' })
    }

    // Construct the data bundle to send to an action
    const dataBundle = {
      rawData: bundle.data,
      rawMapping: bundle.mapping,
      settings: bundle.settings,
      payload,
      auth: bundle.auth,
      features: bundle.features,
      statsContext: bundle.statsContext,
      logger: bundle.logger,
      transactionContext: bundle.transactionContext,
      stateContext: bundle.stateContext,
      audienceSettings: bundle.audienceSettings
    }

    // Construct the request client and perform the action
    const output = await this.performRequest(this.definition.perform, dataBundle)
    results.push({ output: output as JSONObject })

    return results
  }

  async executeBatch(bundle: ExecuteBundle<Settings, InputData[], AudienceSettings>): Promise<void> {
    if (!this.hasBatchSupport) {
      throw new IntegrationError('This action does not support batched requests.', 'NotImplemented', 501)
    }

    let payloads = transformBatch(bundle.mapping, bundle.data) as Payload[]

    // Validate the resolved payloads against the schema
    if (this.schema) {
      const schema = this.schema
      const validationOptions = {
        schemaKey: `${this.destinationName}:${this.definition.title}`,
        throwIfInvalid: false,
        statsContext: bundle.statsContext
      }

      payloads = payloads
        // Remove empty values (`null`, `undefined`, `''`) when not explicitly accepted
        .map((payload) => removeEmptyValues(payload, schema) as Payload)
        // Exclude invalid schemas for now...
        .filter((payload) => validateSchema(payload, schema, validationOptions))
    }

    if (payloads.length === 0) {
      return
    }

    if (this.definition.performBatch) {
      const data = {
        rawData: bundle.data,
        rawMapping: bundle.mapping,
        settings: bundle.settings,
        audienceSettings: bundle.audienceSettings,
        payload: payloads,
        auth: bundle.auth,
        features: bundle.features,
        statsContext: bundle.statsContext,
        logger: bundle.logger,
        transactionContext: bundle.transactionContext,
        stateContext: bundle.stateContext
      }
      await this.performRequest(this.definition.performBatch, data)
    }
  }

  async executeDynamicField(
    field: string,
    data: ExecuteDynamicFieldInput<Settings, Payload, AudienceSettings>
  ): Promise<DynamicFieldResponse> {
    const fn = this.definition.dynamicFields?.[field]
    if (typeof fn !== 'function') {
      return Promise.resolve({
        choices: [],
        nextPage: '',
        error: {
          message: `No dynamic field named ${field} found.`,
          code: '404'
        }
      })
    }

    // fn will always be a dynamic field function, so we can safely cast it to DynamicFieldResponse
    return (await this.performRequest(fn, data)) as DynamicFieldResponse
  }

  /**
   * Perform a request using the definition's request client
   * the given request function
   * and given data bundle
   */
  private async performRequest<T extends Payload | Payload[]>(
    requestFn: RequestFn<Settings, T, any, AudienceSettings>,
    data: ExecuteInput<Settings, T, AudienceSettings>
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
      afterResponse: [this.afterResponse.bind(this)],
      statsContext: data.statsContext
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
