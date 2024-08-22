import { EventEmitter } from 'events'
import createRequestClient from '../create-request-client'
import { JSONLikeObject, JSONObject } from '../json-object'
import { InputData, Features, transform, transformBatch } from '../mapping-kit'
import { fieldsToJsonSchema } from './fields-to-jsonschema'
import { Response } from '../fetch'
import { ModifiedResponse } from '../types'
import type {
  DynamicFieldResponse,
  InputField,
  RequestExtension,
  ExecuteInput,
  Result,
  SyncMode,
  SyncModeDefinition,
  DynamicFieldContext,
  ActionDestinationSuccessResponseType,
  ActionDestinationErrorResponseType
} from './types'
import { syncModeTypes } from './types'
import { HTTPError, NormalizedOptions } from '../request-client'
import type { JSONSchema4 } from 'json-schema'
import { validateSchema } from '../schema-validation'
import { AuthTokens } from './parse-settings'
import { IntegrationError } from '../errors'
import { removeEmptyValues } from '../remove-empty-values'
import { Logger, StatsContext, TransactionContext, StateContext, EngageDestinationCache } from './index'
import { get } from '../get'

type MaybePromise<T> = T | Promise<T>
type RequestClient = ReturnType<typeof createRequestClient>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestFn<Settings, Payload, Return = any, AudienceSettings = any, ActionHookInputs = any> = (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload, AudienceSettings, ActionHookInputs>
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

type HookValueTypes = string | boolean | number | Array<string | boolean | number>
type GenericActionHookValues = Record<string, HookValueTypes>

type GenericActionHookBundle = {
  [K in ActionHookType]?: {
    inputs?: GenericActionHookValues
    outputs?: GenericActionHookValues
  }
}

// Utility type to check if T is an array
type IsArray<T> = T extends (infer U)[] ? U : never

// Multi-status response from a batch request
type PerformBatchResponse = MaybePromise<MultiStatusResponse> | MaybePromise<unknown>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ActionDefinition<
  Settings,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Payload = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AudienceSettings = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GeneratedActionHookBundle extends GenericActionHookBundle = any
> extends BaseActionDefinition {
  /**
   * A way to "register" dynamic fields.
   * This is likely going to change as we productionalize the data model and definition object
   */
  dynamicFields?: {
    [K in keyof Payload]?: IsArray<Payload[K]> extends never
      ? Payload[K] extends object | undefined
        ? {
            [ObjectProperty in keyof Payload[K] | '__keys__' | '__values__']?: RequestFn<
              Settings,
              Payload,
              DynamicFieldResponse,
              AudienceSettings
            >
          }
        : RequestFn<Settings, Payload, DynamicFieldResponse, AudienceSettings>
      : IsArray<Payload[K]> extends object
      ? {
          [ObjectProperty in keyof IsArray<Payload[K]> | '__keys__' | '__values__']?: RequestFn<
            Settings,
            Payload,
            DynamicFieldResponse,
            AudienceSettings
          >
        }
      : never
  }

  /** The operation to perform when this action is triggered */
  perform: RequestFn<Settings, Payload, any, AudienceSettings>

  /** The operation to perform when this action is triggered for a batch of events */
  performBatch?: RequestFn<Settings, Payload[], PerformBatchResponse, AudienceSettings>

  /** Hooks are triggered at some point in a mappings lifecycle. They may perform a request with the
   * destination using the provided inputs and return a response. The response may then optionally be stored
   * in the mapping for later use in the action.
   */
  hooks?: {
    [K in ActionHookType]?: ActionHookDefinition<
      Settings,
      Payload,
      AudienceSettings,
      NonNullable<GeneratedActionHookBundle[K]>['outputs'],
      NonNullable<GeneratedActionHookBundle[K]>['inputs']
    >
  }

  /** The sync mode setting definition. This enables subscription sync mode selection when subscribing to this action. */
  syncMode?: SyncModeDefinition
}

export const hookTypeStrings = ['onMappingSave', 'retlOnMappingSave'] as const
/**
 * The supported actions hooks.
 * on-mapping-save: Called when a mapping is saved by the user. The return from this method is then stored in the mapping.
 */
export type ActionHookType = typeof hookTypeStrings[number]
export interface ActionHookResponse<GeneratedActionHookOutputs> {
  /** A user-friendly message to be shown when the hook is successfully executed. */
  successMessage?: string
  /** After successfully executing a hook, savedData will be persisted for later use in the action. */
  savedData?: GeneratedActionHookOutputs
  error?: {
    /** A user-friendly message to be shown when the hook errors. */
    message: string
    code: string
  }
}

export interface ActionHookDefinition<
  Settings,
  Payload,
  AudienceSettings,
  GeneratedActionHookOutputs,
  GeneratedActionHookTypesInputs
> {
  /** The display title for this hook. */
  label: string
  /** A description of what this hook does. */
  description: string
  /** The configuration fields that are used when executing the hook. The values will be provided by users in the app. */
  inputFields?: Record<
    string,
    Omit<InputField, 'dynamic'> & {
      dynamic?: RequestFn<Settings, Payload, DynamicFieldResponse, AudienceSettings, GeneratedActionHookTypesInputs>
    }
  >
  /** The shape of the return from performHook. These values will be available in the generated-types: Payload for use in perform() */
  outputTypes?: Record<string, { label: string; description: string; type: string; required: boolean }>
  /** The operation to perform when this hook is triggered. */
  performHook: RequestFn<
    Settings,
    Payload,
    ActionHookResponse<GeneratedActionHookOutputs>,
    AudienceSettings,
    GeneratedActionHookTypesInputs
  >
}

export interface ExecuteDynamicFieldInput<Settings, Payload, AudienceSettings = any> {
  settings: Settings
  audienceSettings?: AudienceSettings
  payload: Payload
  page?: string
  auth?: AuthTokens
  /** For internal Segment/Twilio use only. */
  features?: Features | undefined
  statsContext?: StatsContext | undefined
  hookInputs?: GenericActionHookValues
  dynamicFieldContext?: DynamicFieldContext
}

interface ExecuteBundle<T = unknown, Data = unknown, AudienceSettings = any, ActionHookValues = any> {
  data: Data
  settings: T
  audienceSettings?: AudienceSettings
  mapping: JSONObject
  auth: AuthTokens | undefined
  hookOutputs?: Record<ActionHookType, ActionHookValues>
  /** For internal Segment/Twilio use only. */
  features?: Features | undefined
  statsContext?: StatsContext | undefined
  logger?: Logger | undefined
  engageDestinationCache?: EngageDestinationCache | undefined
  transactionContext?: TransactionContext
  stateContext?: StateContext
}

type FillMultiStatusResponseInput = {
  results: Result[]
  batchPayloadLength: number
  status: number
  body: JSONObject | string
  filteredPayloads?: JSONLikeObject[]
}

type SetMultiStatusResponseInput = {
  results: Result[]
  multiStatusResponse: MultiStatusResponse
}

const isSyncMode = (value: unknown): value is SyncMode => {
  return syncModeTypes.find((validValue) => value === validValue) !== undefined
}

const INTERNAL_HIDDEN_FIELDS = ['__segment_internal_sync_mode', '__segment_internal_matching_key']
const removeInternalHiddenFields = (mapping: JSONObject): JSONObject => {
  return Object.keys(mapping).reduce((acc, key) => {
    return INTERNAL_HIDDEN_FIELDS.includes(key) ? acc : { ...acc, [key]: mapping[key] }
  }, {})
}

/**
 * Action is the beginning step for all partner actions. Entrypoints always start with the
 * MapAndValidateInput step.
 */
export class Action<Settings, Payload extends JSONLikeObject, AudienceSettings = any> extends EventEmitter {
  readonly definition: ActionDefinition<Settings, Payload, AudienceSettings>
  readonly destinationName: string
  readonly schema?: JSONSchema4
  readonly hookSchemas?: Record<string, JSONSchema4>
  readonly hasBatchSupport: boolean
  readonly hasHookSupport: boolean
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
    this.hasHookSupport = definition.hooks !== undefined
    // Generate json schema based on the field definitions
    if (Object.keys(definition.fields ?? {}).length) {
      this.schema = fieldsToJsonSchema(definition.fields)
    }
    // Generate a json schema for each defined hook based on the field definitions
    if (definition.hooks) {
      for (const hookName in definition.hooks) {
        const hook = definition.hooks[hookName as ActionHookType]
        if (hook?.inputFields) {
          if (!this.hookSchemas) {
            this.hookSchemas = {}
          }

          const castedInputFields: Record<string, InputField> = {}
          for (const key in hook.inputFields) {
            const field = hook.inputFields[key]

            if (field.dynamic) {
              castedInputFields[key] = {
                ...field,
                dynamic: true
              }
            } else {
              castedInputFields[key] = {
                ...field,
                dynamic: false
              }
            }
          }

          this.hookSchemas[hookName] = fieldsToJsonSchema(castedInputFields)
        }
      }
    }
  }

  async execute(bundle: ExecuteBundle<Settings, InputData | undefined, AudienceSettings>): Promise<Result[]> {
    // TODO cleanup results... not sure it's even used
    const results: Result[] = []

    // Remove internal hidden fields
    const mapping: JSONObject = removeInternalHiddenFields(bundle.mapping)

    // Resolve/transform the mapping with the input data
    let payload = transform(mapping, bundle.data) as Payload
    results.push({ output: 'Mappings resolved' })

    // Remove empty values (`null`, `undefined`, `''`) when not explicitly accepted
    payload = removeEmptyValues(payload, this.schema, true) as Payload

    // Validate the resolved payload against the schema
    if (this.schema) {
      const schemaKey = `${this.destinationName}:${this.definition.title}`
      validateSchema(payload, this.schema, { schemaKey, statsContext: bundle.statsContext })
      results.push({ output: 'Payload validated' })
    }

    let hookOutputs = {}
    if (this.definition.hooks) {
      for (const hookType in this.definition.hooks) {
        const hookOutputValues = bundle.mapping?.[hookType]

        if (hookOutputValues) {
          hookOutputs = { ...hookOutputs, [hookType]: hookOutputValues }
        }
      }
    }

    const syncMode = this.definition.syncMode ? bundle.mapping?.['__segment_internal_sync_mode'] : undefined

    const matchingKey = bundle.mapping?.['__segment_internal_matching_key']

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
      engageDestinationCache: bundle.engageDestinationCache,
      transactionContext: bundle.transactionContext,
      stateContext: bundle.stateContext,
      audienceSettings: bundle.audienceSettings,
      hookOutputs,
      syncMode: isSyncMode(syncMode) ? syncMode : undefined,
      matchingKey: matchingKey ? String(matchingKey) : undefined
    }

    // Construct the request client and perform the action
    const output = await this.performRequest(this.definition.perform, dataBundle)
    results.push({ data: output as JSONObject, output: 'Action Executed' })

    return results
  }

  async executeBatch(bundle: ExecuteBundle<Settings, InputData[], AudienceSettings>): Promise<Result[]> {
    if (!this.hasBatchSupport) {
      throw new IntegrationError('This action does not support batched requests.', 'NotImplemented', 501)
    }

    // Remove internal hidden fields
    const mapping: JSONObject = removeInternalHiddenFields(bundle.mapping)

    let payloads = transformBatch(mapping, bundle.data) as Payload[]
    const batchPayloadLength = payloads.length

    const results: Result[] = []

    // Validate the resolved payloads against the schema
    if (this.schema) {
      const schema = this.schema
      const validationOptions = {
        schemaKey: `${this.destinationName}:${this.definition.title}`,
        throwIfInvalid: false,
        statsContext: bundle.statsContext
      }

      {
        const filteredPayload: Payload[] = []

        for (let i = 0; i < payloads.length; i++) {
          // Remove empty values (`null`, `undefined`, `''`) when not explicitly accepted
          const payload = removeEmptyValues(payloads[i], schema) as Payload
          // Validate payload schema
          const isValid = validateSchema(payload, schema, validationOptions)

          if (isValid) {
            // Event is validated, pass it to the action
            filteredPayload.push(payload)
          } else {
            // Validation failed, record the filtered out event
            results[i] = {
              response: {
                status: 400,
                errortype: 'INVALID_PAYLOAD',
                errormessage: 'Invalid payload',
                errorreporter: 'INTEGRATIONS'
              }
            }
          }
        }

        // Update the payloads with the filtered out events
        payloads = filteredPayload
      }
    }

    let hookOutputs = {}
    if (this.definition.hooks) {
      for (const hookType in this.definition.hooks) {
        const hookOutputValues = bundle.mapping?.[hookType]

        if (hookOutputValues) {
          hookOutputs = { ...hookOutputs, [hookType]: hookOutputValues }
        }
      }
    }

    if (payloads.length === 0) {
      return []
    }

    if (this.definition.performBatch) {
      const syncMode = this.definition.syncMode ? bundle.mapping?.['__segment_internal_sync_mode'] : undefined
      const matchingKey = bundle.mapping?.['__segment_internal_matching_key']

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
        engageDestinationCache: bundle.engageDestinationCache,
        transactionContext: bundle.transactionContext,
        stateContext: bundle.stateContext,
        hookOutputs,
        syncMode: isSyncMode(syncMode) ? syncMode : undefined,
        matchingKey: matchingKey ? String(matchingKey) : undefined
      }

      const requestClient = this.createRequestClient(data)
      // TODO: Add a try/catch block here to handle errors
      const performBatchResponse = await this.definition.performBatch(requestClient, data)

      // PerformBatch returned a legacy response
      if (performBatchResponse instanceof Response && performBatchResponse.status !== 207) {
        // We received a legacy response with a status code other from 207 for the entire batch

        // Try to parse the multi-status response
        let parsedBody: JSONObject | string = {}

        try {
          parsedBody =
            ((performBatchResponse as ModifiedResponse).data as JSONObject) ??
            (performBatchResponse as ModifiedResponse).content
        } catch (e) {
          parsedBody = {}
        }

        this.fillMultiStatusResponse({
          results,
          batchPayloadLength,
          status: performBatchResponse.status,
          body: parsedBody,
          filteredPayloads: payloads
        })

        return results
      }

      // PerformBatch returned a HTTPError
      if (performBatchResponse instanceof HTTPError) {
        this.fillMultiStatusResponse({
          results,
          batchPayloadLength,
          status: performBatchResponse.response.status,
          body: performBatchResponse.message,
          filteredPayloads: payloads
        })
        return results
      }

      // PerformBatch returned a Spec V2 MultiStatus Response
      if (performBatchResponse instanceof MultiStatusResponse) {
        this.setMultiStatusResponse({
          results,
          multiStatusResponse: performBatchResponse
        })

        return results
      }

      // Assume the entire batch to be success in the following conditions
      // - PerformBatch returned an unknown response
      // - PerformBatch returned an unhandled 207 multi-status response
      this.fillMultiStatusResponse({
        results,
        batchPayloadLength,
        status: 200,
        body: {},
        filteredPayloads: payloads
      })
    }

    return results
  }

  /*
   * Extract the dynamic field context and handler path from a field string. Examples:
   * - "structured.first_name" => { dynamicHandlerPath: "structured.first_name" }
   * - "unstructuredObject.testProperty" => { dynamicHandlerPath: "unstructuredObject.__values__", dynamicFieldContext: { selectedKey: "testProperty" } }
   * - "structuredArray.[0].first_name" => { dynamicHandlerPath: "structuredArray.first_name", dynamicFieldContext: { selectedArrayIndex: 0 } }
   */
  private extractFieldContextAndHandler(field: string): {
    dynamicHandlerPath: string
    dynamicFieldContext?: DynamicFieldContext
  } {
    const arrayRegex = /(.*)\.\[(\d+)\]\.(.*)/
    const objectRegex = /(.*)\.(.*)/
    let dynamicHandlerPath = field
    let dynamicFieldContext: DynamicFieldContext | undefined

    const match = arrayRegex.exec(field) || objectRegex.exec(field)
    if (match) {
      const [, parent, indexOrChild, child] = match
      if (child) {
        // It is an array, so we need to extract the index from parent.[index].child and call paret.child handler
        dynamicFieldContext = { selectedArrayIndex: parseInt(indexOrChild, 10) }
        dynamicHandlerPath = `${parent}.${child}`
      } else {
        // It is an object, if there is a dedicated fetcher for child we use it otherwise we use parent.__values__
        const parentFetcher = this.definition.dynamicFields?.[parent]
        if (parentFetcher && !(indexOrChild in parentFetcher)) {
          dynamicHandlerPath = `${parent}.__values__`
          dynamicFieldContext = { selectedKey: indexOrChild }
        }
      }
    }

    return { dynamicHandlerPath, dynamicFieldContext }
  }

  async executeDynamicField(
    field: string,
    data: ExecuteDynamicFieldInput<Settings, Payload, AudienceSettings>,
    /**
     * The dynamicFn argument is optional since it is only used by dynamic hook input fields. (For now)
     */
    dynamicFn?: RequestFn<Settings, Payload, DynamicFieldResponse, AudienceSettings>
  ): Promise<DynamicFieldResponse> {
    if (dynamicFn && typeof dynamicFn === 'function') {
      return (await this.performRequest(dynamicFn, { ...data })) as DynamicFieldResponse
    }

    const { dynamicHandlerPath, dynamicFieldContext } = this.extractFieldContextAndHandler(field)

    const fn = get<RequestFn<Settings, Payload, DynamicFieldResponse, AudienceSettings>>(
      this.definition.dynamicFields,
      dynamicHandlerPath
    )

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
    return (await this.performRequest(fn, { ...data, dynamicFieldContext })) as DynamicFieldResponse
  }

  async executeHook(
    hookType: ActionHookType,
    data: ExecuteInput<Settings, Payload, AudienceSettings>
  ): Promise<ActionHookResponse<any>> {
    if (!this.hasHookSupport) {
      throw new IntegrationError('This action does not support any hooks.', 'NotImplemented', 501)
    }
    const hookFn = this.definition.hooks?.[hookType]?.performHook

    if (!hookFn) {
      throw new IntegrationError(`Missing implementation for hook: ${hookType}.`, 'NotImplemented', 501)
    }

    if (this.hookSchemas?.[hookType]) {
      const schema = this.hookSchemas[hookType]
      validateSchema(data.hookInputs, schema)
    }

    return (await this.performRequest(hookFn, data)) as ActionHookResponse<any>
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

  private fillMultiStatusResponse(input: FillMultiStatusResponseInput) {
    const { results, batchPayloadLength, status, body, filteredPayloads } = input

    for (let i = 0; i < batchPayloadLength; i++) {
      // Check if the index is already set to a failed response
      if (results[i]) {
        continue
      }

      let payloadReadIndex = 0
      results.push({
        response: {
          status: status,
          body: body,
          sent: filteredPayloads ? filteredPayloads[payloadReadIndex++] : {}
        }
      })
    }
  }

  private setMultiStatusResponse(input: SetMultiStatusResponseInput) {
    const { results, multiStatusResponse } = input

    let resultsReadIndex = 0
    for (let i = 0; i < multiStatusResponse.length(); i++) {
      const response = multiStatusResponse.getResponseAtIndex(resultsReadIndex++)

      // Skip the index if we already have a response set
      if (results[i]) {
        continue
      }

      // Check if response is a failed response
      if (
        (response as ActionDestinationErrorResponseType).errortype ||
        (response as ActionDestinationErrorResponseType).errormessage
      ) {
        results[i] = {
          response: {
            ...response,
            errorreporter: 'INTEGRATIONS'
          }
        }

        continue
      }

      // We assume the response is a success response
      results[i] = {
        response: response as ActionDestinationSuccessResponseType
      }
    }
  }
}

export class ActionDestinationSuccessResponse {
  private data: ActionDestinationSuccessResponseType
  public constructor(data: ActionDestinationSuccessResponseType) {
    this.data = data
  }
  public value(): ActionDestinationSuccessResponseType {
    return this.data
  }
}

export class ActionDestinationErrorResponse {
  private data: ActionDestinationErrorResponseType
  public constructor(data: ActionDestinationErrorResponseType) {
    this.data = data
  }
  public value(): ActionDestinationErrorResponseType {
    return this.data
  }
}

export type MultiStatusPayloadValidatorFn<PayloadType extends object = object> = (
  payload: PayloadType,
  batchIndex: number
) => ActionDestinationSuccessResponse | ActionDestinationErrorResponse | boolean

export type MultiStatusPayloadTransformerFn<
  PayloadType extends object = object,
  TransformedPayloadType extends object = object
> = (payload: PayloadType, filteredPayloadIndex: number, batchIndex: number) => TransformedPayloadType

export class MultiStatusResponse {
  private responses: (ActionDestinationSuccessResponse | ActionDestinationErrorResponse)[] = []

  public length(): number {
    return this.responses.length
  }

  pushResponse(response: ActionDestinationSuccessResponse | ActionDestinationErrorResponse) {
    this.responses.push(response)
  }

  // Pushes a Generic Response at the end of the responses array
  public pushResponseObject(response: ActionDestinationSuccessResponse | ActionDestinationErrorResponse) {
    this.responses.push(response)
  }

  // Pushes a Success Response at the end of the responses array
  public pushSuccessResponse(response: ActionDestinationSuccessResponse | ActionDestinationSuccessResponseType) {
    if (response instanceof ActionDestinationSuccessResponse) {
      this.responses.push(response)
    } else {
      this.responses.push(new ActionDestinationSuccessResponse(response))
    }
  }

  // Pushes an Error Response at the end of the responses array
  public pushErrorResponse(response: ActionDestinationErrorResponse | ActionDestinationErrorResponseType) {
    if (response instanceof ActionDestinationErrorResponse) {
      this.responses.push(response)
    } else {
      this.responses.push(new ActionDestinationErrorResponse(response))
    }
  }

  // Pushes a Generic Response at the specified index of the responses array
  public pushResponseObjectAtIndex(
    index: number,
    response: ActionDestinationSuccessResponse | ActionDestinationErrorResponse
  ) {
    this.responses[index] = response
  }

  // Pushes a Success Response at the specified index of the responses array
  public setSuccessResponseAtIndex(
    index: number,
    response: ActionDestinationSuccessResponse | ActionDestinationSuccessResponseType
  ) {
    if (response instanceof ActionDestinationSuccessResponse) {
      this.responses[index] = response
    } else {
      this.responses[index] = new ActionDestinationSuccessResponse(response)
    }
  }

  // Pushes an Error Response at the specified index of the responses array
  public setErrorResponseAtIndex(
    index: number,
    response: ActionDestinationErrorResponse | ActionDestinationErrorResponseType
  ) {
    if (response instanceof ActionDestinationErrorResponse) {
      this.responses[index] = response
    } else {
      this.responses[index] = new ActionDestinationErrorResponse(response)
    }
  }

  // Remove the response at the specified index of the responses array by setting it to empty
  // Note: This will not remove the index from the array
  public unsetResponseAtIndex(index: number) {
    delete this.responses[index]
  }

  public getResponseAtIndex(index: number): ActionDestinationSuccessResponseType | ActionDestinationErrorResponseType {
    return this.responses[index].value()
  }

  public getAllResponses(): (ActionDestinationSuccessResponseType | ActionDestinationErrorResponseType)[] {
    return this.responses.map((response) => response.value())
  }
}

export class MultiStatusResponseBuilder<PayloadType extends object = object> {
  private payloads: PayloadType[]

  private invalidPayloadIndices: Set<number>
  private validPayloadIndexToBatchIndexMap: Map<number, number>

  private multiStatusResponse: (ActionDestinationSuccessResponse | ActionDestinationErrorResponse)[]

  constructor(payloads: PayloadType[]) {
    this.payloads = payloads

    this.invalidPayloadIndices = new Set<number>()

    // By default we assume all payloads are valid
    this.validPayloadIndexToBatchIndexMap = new Map<number, number>()
    for (let i = 0; i < this.payloads.length; i++) {
      this.validPayloadIndexToBatchIndexMap.set(i, i)
    }

    this.multiStatusResponse = new Array<ActionDestinationSuccessResponse | ActionDestinationErrorResponse>(
      this.payloads.length
    )
  }

  public filterPayloads<TransformedPayloadType extends object = object>(input: {
    validator: MultiStatusPayloadValidatorFn<PayloadType>
    transformer?: MultiStatusPayloadTransformerFn<PayloadType, TransformedPayloadType>
    defaultValidationCode?: number
    defaultValidationMessage?: string
  }) {
    this.invalidPayloadIndices.clear()
    this.validPayloadIndexToBatchIndexMap.clear()
    const validatedPayloads: (PayloadType | TransformedPayloadType)[] = []

    // Iterate over the payloads and validate them
    for (let batchIndex = 0, filteredPayloadIndex = 0; batchIndex < this.payloads.length; batchIndex++) {
      //Filter out nullish payloads
      if (!this.payloads[batchIndex]) {
        this.multiStatusResponse[batchIndex] = new ActionDestinationErrorResponse({
          status: input.defaultValidationCode ?? 400,
          errortype: 'INVALID_PAYLOAD',
          errormessage: input.defaultValidationMessage ?? 'Invalid Payload'
        })

        continue
      }

      // Execute the validation function
      const validationResponse = input.validator(this.payloads[batchIndex], batchIndex)

      // Check the validation response for an object value
      // Filter the payload regardless of whether the response status indicates success or error
      if (
        validationResponse instanceof ActionDestinationSuccessResponse ||
        validationResponse instanceof ActionDestinationErrorResponse
      ) {
        this.multiStatusResponse[batchIndex] = validationResponse
        continue
      }

      // Check the validation response for a boolean value
      // Only filter out the payload if the validation response is false
      if (typeof validationResponse === 'boolean' && !validationResponse) {
        this.multiStatusResponse[batchIndex] = new ActionDestinationErrorResponse({
          status: input.defaultValidationCode ?? 400,
          errortype: 'INVALID_PAYLOAD',
          errormessage: input.defaultValidationMessage ?? 'Invalid Payload'
        })

        continue
      }

      // If a transformation function is provided, transform the payload
      if (input.transformer) {
        const transformedPayload = input.transformer(this.payloads[batchIndex], filteredPayloadIndex++, batchIndex)
        validatedPayloads.push(transformedPayload)
      } else {
        validatedPayloads.push(this.payloads[batchIndex])
      }

      // Keep track of the valid payload index to the batch index
      // Stored as Map<ValidPayloadIndex, BatchIndex>
      this.validPayloadIndexToBatchIndexMap.set(validatedPayloads.length - 1, batchIndex)
    }

    return validatedPayloads
  }

  public async mergeAPIResponse<APIResponseType = unknown>(input: {
    apiResponse: MaybePromise<ModifiedResponse<APIResponseType>>
    responseParser: (
      response: ModifiedResponse<APIResponseType>,
      validEventsCount: number
    ) => (ActionDestinationSuccessResponse | ActionDestinationErrorResponse)[]
  }) {
    const response = await input.apiResponse
    const parsedResponses = input.responseParser(response, this.validPayloadIndexToBatchIndexMap.size)

    if (parsedResponses.length !== this.payloads.length - this.invalidPayloadIndices.size) {
      throw new IntegrationError(
        `The number of parsed responses (${parsedResponses.length}) does not match the number of valid payloads (${this.validPayloadIndexToBatchIndexMap.size}).`,
        'InvalidMultiStatusResponse',
        400
      )
    }

    // If the filterInvalidPayloads method was not executed, we assume all payloads are validated
    // hence we skip the merging process and directly assign the parsed responses to the MultiStatus responses array
    if (this.invalidPayloadIndices.size === 0) {
      for (let i = 0; i < parsedResponses.length; i++) {
        this.multiStatusResponse[i] = parsedResponses[i]
      }

      return
    }

    // If the filterInvalidPayloads method was executed
    // we need to merge the parsed responses with the MultiStatus responses array
    for (let i = 0; i < parsedResponses.length; i++) {
      const resolvedIndex = this.validPayloadIndexToBatchIndexMap.get(i)

      if (!resolvedIndex) {
        throw new IntegrationError(
          `Failed to resolve MultiStatus response at index ${i}.`,
          'InvalidMultiStatusResponse',
          400
        )
      }

      this.multiStatusResponse[resolvedIndex] = parsedResponses[i]
    }
  }

  public handleHTTPError(error: HTTPError) {
    // If the filterInvalidPayloads method was not executed, we assume all payloads are validated
    // hence we skip the merging process and directly fill the error responses to the MultiStatus responses array
    if (this.invalidPayloadIndices.size === 0) {
      for (let i = 0; i < this.payloads.length; i++) {
        this.multiStatusResponse[i] = new ActionDestinationErrorResponse({
          status: error.response.status,
          errortype: 'HTTP_ERROR',
          errormessage: error.message
        })
      }

      return
    }

    // If the filterInvalidPayloads method was executed
    // we need to merge and fill the error to the MultiStatus responses array
    for (const mapItem of this.validPayloadIndexToBatchIndexMap) {
      const resolvedIndex = mapItem[1]
      this.multiStatusResponse[resolvedIndex] = new ActionDestinationErrorResponse({
        status: error.response.status,
        errortype: 'HTTP_ERROR',
        errormessage: error.message
      })
    }
  }

  public buildMultiStatusResponse() {
    return this.multiStatusResponse
  }
}
