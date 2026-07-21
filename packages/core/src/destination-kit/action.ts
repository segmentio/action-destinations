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
  ActionDestinationErrorResponseType,
  ResultMultiStatusNode,
  AudienceMembership
} from './types'
import { syncModeTypes } from './types'
import { HTTPError, NormalizedOptions } from '../request-client'
import type { JSONSchema4 } from 'json-schema'
import { validateSchema } from '../schema-validation'
import { AuthTokens } from './parse-settings'
import {
  ErrorCodes,
  getErrorCodeFromHttpStatus,
  IntegrationError,
  InvalidAuthenticationError,
  MultiStatusErrorReporter,
  RetryableError
} from '../errors'
import { removeEmptyValues } from '../remove-empty-values'
import { resolveAudienceMembership } from '../audience-membership'
import {
  Logger,
  StatsContext,
  Personas,
  TransactionContext,
  StateContext,
  EngageDestinationCache,
  SubscriptionMetadata
} from './index'
import { get } from '../get'

type MaybePromise<T> = T | Promise<T>
type RequestClient = ReturnType<typeof createRequestClient>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestFn<
  Settings,
  Payload,
  Return = any,
  AudienceSettings = any,
  ActionHookInputs = any,
  AudienceMembershipType = AudienceMembership | AudienceMembership[]
> = (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload, AudienceSettings, ActionHookInputs, any, AudienceMembershipType>
) => MaybePromise<Return>

interface ReservedInputFields {
  batch_keys?: {
    label: string
    description: string
    type: 'string'
    unsafe_hidden?: true
    multiple?: true
    required?: false
    default?: string[]
  }
}

type ActionFields = Omit<Record<string, InputField>, keyof ReservedInputFields> & ReservedInputFields

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
  fields: ActionFields
}

type HookValueTypes = string | boolean | number | Array<string | boolean | number>
type GenericActionHookValues = Record<string, HookValueTypes>

// Utility type to check if T is an array
type IsArray<T> = T extends (infer U)[] ? U : never

// Multi-status response from a batch request
type PerformBatchResponse = MaybePromise<MultiStatusResponse> | MaybePromise<unknown>

// Enum representing a Poll Job Status:
// Possible values: IN_PROGRESS, SUCCEEDED, FAILED, RETRYABLE_ERROR
// - IN_PROGRESS: API responded with 2xx but Job is still in progress
// - SUCCEEDED: Terminal state where Job Completed successfully
// - FAILED: Terminal state where Job Failed with a permanent error
// - RETRYABLE_ERROR: The API is reporting transient errors like 429, 500, etc
type PollJobStatus = 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'RETRYABLE_ERROR'

// Response from a performBatch of an AsyncActionDefinition
export type AsyncBatchResponse = {
  // Job ID returned by partner API used to poll result
  // It could be undefined if the performBatch method failed
  jobId?: string

  // HTTP status code returned by the partner API during performBatch
  status: number

  // performBatch must always return a multi-status response
  multiStatusResponse: MultiStatusResponse
}

// The payload passed into a poll operation of an AsyncActionDefinition.
export type PollPayload = {
  // Job ID returned from the performBatch response that identifies the batch request being polled
  jobId: string

  // Number of records/files uploaded during the performBatch operation being polled
  uploadCount: number
}

// The response from a poll operation of an AsyncActionDefinition.
export type PollResponse = {
  // Echo back the job ID being polled
  jobId: string

  // HTTP status code returned by the partner API during the poll operation
  status: number

  // The status of the poll operation
  jobStatus: PollJobStatus

  // Return a multi-status response
  // If not available, the status code will be used to determine the outcome
  multiStatusResponse?: MultiStatusResponse
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ActionDefinition<
  Settings,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Payload = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AudienceSettings = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GeneratedActionHookInputs = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GeneratedActionHookOutputs = any
> extends BaseActionDefinition {
  /**
   * A way to "register" dynamic fields.
   * This is likely going to change as we productionalize the data model and definition object
   */
  dynamicFields?: {
    [K in keyof Payload]?: IsArray<Payload[K]> extends never
      ? Payload[K] extends object | undefined
        ? {
            [ObjectProperty in keyof NonNullable<Payload[K]> | '__keys__' | '__values__']?: RequestFn<
              Settings,
              Payload,
              DynamicFieldResponse,
              AudienceSettings
            >
          }
        : RequestFn<Settings, Payload, DynamicFieldResponse, AudienceSettings>
      : IsArray<Payload[K]> extends object
      ? {
          [ObjectProperty in keyof NonNullable<IsArray<Payload[K]>> | '__keys__' | '__values__']?: RequestFn<
            Settings,
            Payload,
            DynamicFieldResponse,
            AudienceSettings
          >
        }
      : never
  }

  /** The operation to perform when this action is triggered */
  perform: RequestFn<Settings, Payload, any, AudienceSettings, any, AudienceMembership>

  /** The operation to perform when this action is triggered for a batch of events */
  performBatch?: RequestFn<Settings, Payload[], PerformBatchResponse, AudienceSettings, any, AudienceMembership[]>

  /** Hooks are triggered at some point in a mappings lifecycle. They may perform a request with the
   * destination using the provided inputs and return a response. The response may then optionally be stored
   * in the mapping for later use in the action.
   */
  hooks?: {
    [K in ActionHookType]?: ActionHookDefinition<
      Settings,
      Payload,
      AudienceSettings,
      NonNullable<GeneratedActionHookInputs>,
      NonNullable<GeneratedActionHookOutputs>
    >
  }

  /** The sync mode setting definition. This enables subscription sync mode selection when subscribing to this action. */
  syncMode?: SyncModeDefinition
}

export interface AsyncActionDefinition<
  Settings,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Payload = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AudienceSettings = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GeneratedActionHookInputs = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GeneratedActionHookOutputs = any
> extends BaseActionDefinition {
  /**
   * A way to "register" dynamic fields.
   * This is likely going to change as we productionalize the data model and definition object
   */
  dynamicFields?: {
    [K in keyof Payload]?: IsArray<Payload[K]> extends never
      ? Payload[K] extends object | undefined
        ? {
            [ObjectProperty in keyof NonNullable<Payload[K]> | '__keys__' | '__values__']?: RequestFn<
              Settings,
              Payload,
              DynamicFieldResponse,
              AudienceSettings
            >
          }
        : RequestFn<Settings, Payload, DynamicFieldResponse, AudienceSettings>
      : IsArray<Payload[K]> extends object
      ? {
          [ObjectProperty in keyof NonNullable<IsArray<Payload[K]>> | '__keys__' | '__values__']?: RequestFn<
            Settings,
            Payload,
            DynamicFieldResponse,
            AudienceSettings
          >
        }
      : never
  }

  /** Async Actions don't support the perform operation, even in case of single payload it should always be handled as a batch */

  /** The operation to perform when this action is triggered for a batch of events */
  performBatch: RequestFn<Settings, Payload[], AsyncBatchResponse, AudienceSettings, any, AudienceMembership[]>

  performPoll: RequestFn<Settings, PollPayload, PollResponse, AudienceSettings>

  /** Hooks are triggered at some point in a mappings lifecycle. They may perform a request with the
   * destination using the provided inputs and return a response. The response may then optionally be stored
   * in the mapping for later use in the action.
   */
  hooks?: {
    [K in ActionHookType]?: ActionHookDefinition<
      Settings,
      Payload,
      AudienceSettings,
      NonNullable<GeneratedActionHookInputs>,
      NonNullable<GeneratedActionHookOutputs>
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
  GeneratedActionHookTypesInputs,
  GeneratedActionHookOutputs
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
  personasContext?: Personas | undefined
  logger?: Logger | undefined
  engageDestinationCache?: EngageDestinationCache
  transactionContext?: TransactionContext
  stateContext?: StateContext
  subscriptionMetadata?: SubscriptionMetadata
  signal?: AbortSignal
}

interface PollBundle<T = unknown> {
  data: PollPayload
  settings: T
  auth: AuthTokens | undefined
  /** For internal Segment/Twilio use only. */
  features?: Features | undefined
  statsContext?: StatsContext | undefined
  logger?: Logger | undefined
  transactionContext?: TransactionContext
  stateContext?: StateContext
  subscriptionMetadata?: SubscriptionMetadata
  signal?: AbortSignal
}

type FillMultiStatusResponseInput = {
  multiStatusResponse: ResultMultiStatusNode[]
  invalidPayloadIndices: Set<number>
  batchPayloadLength: number
  status: number
  body: JSONLikeObject | string
  filteredPayloads?: JSONLikeObject[]
}

const isSyncMode = (value: unknown): value is SyncMode => {
  return syncModeTypes.find((validValue) => value === validValue) !== undefined
}

/**
 * Action is the beginning step for all partner actions. Entrypoints always start with the
 * MapAndValidateInput step.
 */
export class Action<Settings, Payload extends JSONLikeObject, AudienceSettings = any> extends EventEmitter {
  readonly definition: ActionDefinition<Settings, Payload, AudienceSettings, unknown, unknown>
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
    definition: ActionDefinition<Settings, Payload, AudienceSettings, unknown, unknown>,
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

    // Resolve/transform the mapping with the input data
    let payload = transform(bundle.mapping, bundle.data, bundle.statsContext) as Payload
    results.push({ output: 'Mappings resolved' })

    // Remove empty values (`null`, `undefined`, `''`) when not explicitly accepted
    payload = removeEmptyValues(payload, this.schema, true) as Payload

    // Validate the resolved payload against the schema
    if (this.schema) {
      const schemaKey = `${this.destinationName}:${this.definition.title}`
      // AJV schema validator removes non mandatory fields post validation
      // Refer https://ajv.js.org/guide/modifying-data.html#removing-additional-properties
      // https://github.com/segmentio/action-destinations/blob/d245e420e56957e784c29b5c09d80f3e1e64e6c5/packages/core/src/schema-validation.ts#L21
      validateSchema(payload, this.schema, {
        schemaKey,
        statsContext: bundle.statsContext,
        exempt: ['dynamicAuthSettings']
      })
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

    const syncModeVal = this.definition.syncMode ? bundle.mapping?.['__segment_internal_sync_mode'] : undefined
    const syncMode = isSyncMode(syncModeVal) ? syncModeVal : undefined
    const matchingKey = bundle.mapping?.['__segment_internal_matching_key']
    const audienceMembership = resolveAudienceMembership(bundle.data, syncMode)

    // Construct the data bundle to send to an action
    const dataBundle = {
      rawData: bundle.data,
      rawMapping: bundle.mapping,
      settings: bundle.settings,
      payload,
      ...(typeof audienceMembership === 'boolean' ? { audienceMembership } : {}),
      auth: bundle.auth,
      features: bundle.features,
      statsContext: bundle.statsContext,
      personasContext: bundle.personasContext,
      logger: bundle.logger,
      engageDestinationCache: bundle.engageDestinationCache,
      transactionContext: bundle.transactionContext,
      stateContext: bundle.stateContext,
      audienceSettings: bundle.audienceSettings,
      hookOutputs,
      syncMode,
      matchingKey: matchingKey ? String(matchingKey) : undefined,
      subscriptionMetadata: bundle.subscriptionMetadata,
      signal: bundle?.signal
    }
    // Construct the request client and perform the action
    const output = await this.performRequest(this.definition.perform, dataBundle)
    results.push({ data: output as JSONObject, output: 'Action Executed' })

    return results
  }

  async executeBatch(bundle: ExecuteBundle<Settings, InputData[], AudienceSettings>): Promise<ResultMultiStatusNode[]> {
    if (!this.hasBatchSupport) {
      throw new IntegrationError('This action does not support batched requests.', 'NotImplemented', 501)
    }

    const mapping: JSONObject = bundle.mapping

    let payloads = transformBatch(mapping, bundle.data, bundle.statsContext) as Payload[]
    const batchPayloadLength = payloads.length

    const multiStatusResponse: ResultMultiStatusNode[] = []
    const invalidPayloadIndices = new Set<number>()

    // Validate the resolved payloads against the schema
    if (this.schema) {
      const schema = this.schema
      const validationOptions = {
        schemaKey: `${this.destinationName}:${this.definition.title}`,
        throwIfInvalid: true,
        statsContext: bundle.statsContext,
        exempt: ['dynamicAuthSettings']
      }

      // Filter out invalid payloads before sending them to the action
      {
        const filteredPayload: Payload[] = []

        for (let i = 0; i < payloads.length; i++) {
          // Validate payload schema
          const payload = removeEmptyValues(payloads[i], schema) as Payload
          try {
            // AJV schema validator only removes fields that are not defined in the schema (Refer ajv docs)
            // Refer https://ajv.js.org/guide/modifying-data.html#removing-additional-properties
            // https://github.com/segmentio/action-destinations/blob/d245e420e56957e784c29b5c09d80f3e1e64e6c5/packages/core/src/schema-validation.ts#L21
            validateSchema(payload, schema, validationOptions)
          } catch (e) {
            // Validation failed with an exception, record the filtered out event
            multiStatusResponse[i] = {
              status: 400,
              errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
              errormessage: (e as Error).message,
              errorreporter: MultiStatusErrorReporter.INTEGRATIONS
            }

            invalidPayloadIndices.add(i)

            // Add datadog stats for events that are discarded by Actions
            bundle.statsContext?.statsClient?.incr('action.multistatus_discard', 1, bundle.statsContext?.tags)
            continue
          }

          // Event is validated, pass it to the action
          filteredPayload.push(payload)
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
      return multiStatusResponse
    }

    if (this.definition.performBatch) {
      const syncModeVal = this.definition.syncMode ? bundle.mapping?.['__segment_internal_sync_mode'] : undefined
      const syncMode = isSyncMode(syncModeVal) ? syncModeVal : undefined
      const matchingKey = bundle.mapping?.['__segment_internal_matching_key']
      const audienceMembership = bundle.data
        .map((d) => resolveAudienceMembership(d, syncMode))
        .filter((_, i) => !invalidPayloadIndices.has(i))

      const data = {
        rawData: bundle.data,
        rawMapping: bundle.mapping,
        settings: bundle.settings,
        audienceSettings: bundle.audienceSettings,
        payload: payloads,
        audienceMembership,
        auth: bundle.auth,
        features: bundle.features,
        statsContext: bundle.statsContext,
        personasContext: bundle.personasContext,
        logger: bundle.logger,
        engageDestinationCache: bundle.engageDestinationCache,
        transactionContext: bundle.transactionContext,
        stateContext: bundle.stateContext,
        subscriptionMetadata: bundle.subscriptionMetadata,
        hookOutputs,
        syncMode,
        matchingKey: matchingKey ? String(matchingKey) : undefined,
        signal: bundle?.signal
      }

      const requestClient = this.createRequestClient(data)
      const performBatchResponse = await this.definition.performBatch(requestClient, data)

      // PerformBatch returned a legacy response
      if (performBatchResponse instanceof Response) {
        // We received a legacy response for the entire batch

        // Try to parse the multi-status response
        let parsedBody: JSONObject | string = {}

        parsedBody =
          ((performBatchResponse as ModifiedResponse)?.data as JSONObject) ??
          (performBatchResponse as ModifiedResponse)?.content ??
          {}

        this.fillMultiStatusResponse({
          multiStatusResponse,
          invalidPayloadIndices,
          batchPayloadLength,
          status: performBatchResponse.status,
          body: parsedBody,
          filteredPayloads: payloads
        })

        return multiStatusResponse
      }

      // PerformBatch returned a HTTPError
      if (performBatchResponse instanceof HTTPError) {
        this.fillMultiStatusResponse({
          multiStatusResponse,
          invalidPayloadIndices,
          batchPayloadLength,
          status: performBatchResponse.response.status,
          body: performBatchResponse.message,
          filteredPayloads: payloads
        })

        return multiStatusResponse
      }

      // PerformBatch returned a Spec V2 compliant MultiStatus Response
      if (performBatchResponse instanceof MultiStatusResponse) {
        let resultsReadIndex = 0

        for (let i = 0; i < batchPayloadLength; i++) {
          // Skip the index if we already have a response set
          if (invalidPayloadIndices.has(i)) {
            continue
          }

          const response = performBatchResponse.getResponseAtIndex(resultsReadIndex++)
          // We assume the response to be a failed response if it is undefined
          // This is likely due to incorrect implementation of the MultiStatusResponse
          if (!response) {
            multiStatusResponse[i] = {
              status: 500,
              errormessage: 'MultiStatusResponse is missing a response at the specified index',
              errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
              errorreporter: MultiStatusErrorReporter.INTEGRATIONS
            }

            // Add datadog stats for events that are discarded by Actions
            bundle.statsContext?.statsClient?.incr('action.multistatus_discard', 1, bundle.statsContext?.tags)
            continue
          }

          // Check if response is a failed response
          if (response instanceof ActionDestinationErrorResponse) {
            const responseValue = response.value()

            // Check if the error has a 'sent' or 'body' field set, we assume it to be an error from the API Call
            // Else we assume it to be an error from the Integration validations
            multiStatusResponse[i] = {
              ...responseValue,
              errorreporter:
                responseValue.sent || responseValue.body
                  ? MultiStatusErrorReporter.DESTINATION
                  : MultiStatusErrorReporter.INTEGRATIONS
            }

            // Add datadog stats for events that are discarded by Destination
            bundle.statsContext?.statsClient?.incr('destination.multistatus_discard', 1, bundle.statsContext?.tags)
            continue
          }

          // We assume the response is a success response
          multiStatusResponse[i] = response.value()
        }

        return multiStatusResponse
      }

      // Assume the entire batch to be success in performBatch returned an unknown response
      this.fillMultiStatusResponse({
        multiStatusResponse,
        invalidPayloadIndices,
        batchPayloadLength,
        status: 200,
        body: {},
        filteredPayloads: payloads
      })
    }

    return multiStatusResponse
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
      validateSchema(data.hookInputs, schema, {
        exempt: ['dynamicAuthSettings']
      })
    }

    return (await this.performRequest(hookFn, data)) as ActionHookResponse<any>
  }

  /**
   * Perform a request using the definition's request client
   * the given request function
   * and given data bundle
   */
  private async performRequest<T extends Payload | Payload[], M extends AudienceMembership | AudienceMembership[]>(
    requestFn: RequestFn<Settings, T, any, AudienceSettings, any, M>,
    data: ExecuteInput<Settings, T, AudienceSettings, any, any, M>
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
      statsContext: data.statsContext,
      signal: data?.signal
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
    const { multiStatusResponse, batchPayloadLength, status, body, filteredPayloads } = input

    let payloadReadIndex = 0
    for (let i = 0; i < batchPayloadLength; i++) {
      // Check if the index is already set to a failed response
      if (input.invalidPayloadIndices.has(i)) {
        continue
      }

      multiStatusResponse[i] = {
        status: status,
        body: body,
        sent: filteredPayloads ? filteredPayloads[payloadReadIndex++] : {}
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

    // If the error type is not set, try to infer it from the status code
    if (!this.data.errortype) {
      this.data.errortype = getErrorCodeFromHttpStatus(this.data.status)
    }
  }
  public value(): ActionDestinationErrorResponseType {
    return this.data
  }
}

/**
 * AsyncAction is similar to Action but designed for asynchronous batch processing.
 * It does not support single-event perform operations - all events must be processed as batches.
 * It includes support for polling to check the status of async batch operations.
 */
export class AsyncAction<Settings, Payload extends JSONLikeObject, AudienceSettings = any> extends EventEmitter {
  readonly definition: AsyncActionDefinition<Settings, Payload, AudienceSettings, unknown, unknown>
  readonly destinationName: string
  readonly schema?: JSONSchema4
  readonly hookSchemas?: Record<string, JSONSchema4>
  readonly hasHookSupport: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extendRequest: RequestExtension<Settings, any> | undefined

  constructor(
    destinationName: string,
    definition: AsyncActionDefinition<Settings, Payload, AudienceSettings, unknown, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extendRequest?: RequestExtension<Settings, any>
  ) {
    super()
    this.definition = definition
    this.destinationName = destinationName
    this.extendRequest = extendRequest
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

  async executeBatch(bundle: ExecuteBundle<Settings, InputData[], AudienceSettings>): Promise<AsyncBatchResponse> {
    const mapping: JSONObject = bundle.mapping

    let payloads = transformBatch(mapping, bundle.data, bundle.statsContext) as Payload[]
    const batchPayloadLength = payloads.length

    const multiStatusResponse = new MultiStatusResponse()
    const invalidPayloadIndices = new Set<number>()

    // Validate the resolved payloads against the schema
    if (this.schema) {
      const schema = this.schema
      const validationOptions = {
        schemaKey: `${this.destinationName}:${this.definition.title}`,
        throwIfInvalid: true,
        statsContext: bundle.statsContext,
        exempt: ['dynamicAuthSettings']
      }

      // Filter out invalid payloads before sending them to the action
      {
        const filteredPayload: Payload[] = []

        for (let i = 0; i < payloads.length; i++) {
          // Validate payload schema
          const payload = removeEmptyValues(payloads[i], schema) as Payload
          try {
            validateSchema(payload, schema, validationOptions)
          } catch (e) {
            // Validation failed with an exception, record the filtered out event
            multiStatusResponse.setErrorResponseAtIndex(i, {
              status: 400,
              errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
              errormessage: (e as Error).message
            })

            invalidPayloadIndices.add(i)

            // Add datadog stats for events that are discarded by Actions
            bundle.statsContext?.statsClient?.incr('action.multistatus_discard', 1, bundle.statsContext?.tags)
            continue
          }

          // Event is validated, pass it to the action
          filteredPayload.push(payload)
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
      return { jobId: undefined, status: 200, multiStatusResponse }
    }

    const syncModeVal = this.definition.syncMode ? bundle.mapping?.['__segment_internal_sync_mode'] : undefined
    const syncMode = isSyncMode(syncModeVal) ? syncModeVal : undefined
    const matchingKey = bundle.mapping?.['__segment_internal_matching_key']
    // Filter audienceMembership by the same invalid indices used to compact `payloads` above,
    // so audienceMembership[i] stays aligned with payload[i] in performBatch.
    const audienceMembership = bundle.data
      .map((d) => resolveAudienceMembership(d, syncMode))
      .filter((_, i) => !invalidPayloadIndices.has(i))

    const data = {
      rawData: bundle.data,
      rawMapping: bundle.mapping,
      settings: bundle.settings,
      audienceSettings: bundle.audienceSettings,
      payload: payloads,
      audienceMembership,
      auth: bundle.auth,
      features: bundle.features,
      statsContext: bundle.statsContext,
      logger: bundle.logger,
      engageDestinationCache: bundle.engageDestinationCache,
      transactionContext: bundle.transactionContext,
      stateContext: bundle.stateContext,
      subscriptionMetadata: bundle.subscriptionMetadata,
      hookOutputs,
      syncMode,
      matchingKey: matchingKey ? String(matchingKey) : undefined,
      signal: bundle?.signal
    }

    const requestClient = this.createRequestClient(data)

    // Call performBatch and catch any errors thrown from Integrations
    let performBatchResponse: AsyncBatchResponse
    try {
      performBatchResponse = await this.definition.performBatch(requestClient, data)
    } catch (error) {
      // Handle action errors and convert them into a multi-status response for the entire batch
      // If an unhandled error is thrown, it gets propagated to the caller
      this.parseBatchError(error, {
        multiStatusResponse,
        invalidPayloadIndices,
        batchPayloadLength,
        filteredPayloads: payloads
      })

      const errorStatus = (error as HTTPError)?.response?.status ?? (error as IntegrationError)?.status ?? 500
      return { jobId: undefined, status: errorStatus, multiStatusResponse }
    }

    const { jobId, multiStatusResponse: batchMultiStatus } = performBatchResponse
    // performBatch resolved without throwing, so the batch submission itself succeeded.
    // Default the top-level status to 200 when an integration omits it, rather than leaking
    // `status: undefined` to callers; per-item outcomes are carried in the multiStatusResponse.
    const status = performBatchResponse.status ?? 200

    // Process the multi-status response from performBatch
    let resultsReadIndex = 0

    for (let i = 0; i < batchPayloadLength; i++) {
      // Skip the index if we already have a response set
      if (invalidPayloadIndices.has(i)) {
        continue
      }

      const response = batchMultiStatus.getResponseAtIndex(resultsReadIndex++)
      // We assume the response to be a failed response if it is undefined
      if (!response) {
        multiStatusResponse.setErrorResponseAtIndex(i, {
          status: 500,
          errormessage: 'MultiStatusResponse is missing a response at the specified index',
          errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED
        })

        bundle.statsContext?.statsClient?.incr('action.multistatus_discard', 1, bundle.statsContext?.tags)
        continue
      }

      // Check if response is a failed response
      if (response instanceof ActionDestinationErrorResponse) {
        multiStatusResponse.setErrorResponseAtIndex(i, response.value())

        bundle.statsContext?.statsClient?.incr('destination.multistatus_discard', 1, bundle.statsContext?.tags)
        continue
      }

      // We assume the response is a success response
      multiStatusResponse.setSuccessResponseAtIndex(i, response.value())
    }

    return { jobId, status, multiStatusResponse }
  }

  async executePoll(bundle: PollBundle<Settings>): Promise<PollResponse> {
    const dataBundle = {
      rawData: bundle.data,
      settings: bundle.settings,
      payload: bundle.data,
      auth: bundle.auth,
      features: bundle.features,
      statsContext: bundle.statsContext,
      logger: bundle.logger,
      transactionContext: bundle.transactionContext,
      stateContext: bundle.stateContext,
      subscriptionMetadata: bundle.subscriptionMetadata,
      signal: bundle?.signal
    }

    const requestClient = this.createRequestClient(dataBundle)
    return this.definition.performPoll(requestClient, dataBundle)
  }

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
        dynamicFieldContext = { selectedArrayIndex: parseInt(indexOrChild, 10) }
        dynamicHandlerPath = `${parent}.${child}`
      } else {
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
      validateSchema(data.hookInputs, schema, {
        exempt: ['dynamicAuthSettings']
      })
    }

    return (await this.performRequest(hookFn, data)) as ActionHookResponse<any>
  }

  private async performRequest<
    T extends Payload | Payload[] | PollPayload,
    M extends AudienceMembership | AudienceMembership[]
  >(
    requestFn: RequestFn<Settings, T, any, AudienceSettings, any, M>,
    data: ExecuteInput<Settings, T, AudienceSettings, any, any, M>
  ): Promise<unknown> {
    const requestClient = this.createRequestClient(data)
    const response = await requestFn(requestClient, data)
    return this.parseResponse(response)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createRequestClient(data: ExecuteInput<Settings, any>): RequestClient {
    const options = this.extendRequest?.(data) ?? {}
    return createRequestClient(options, {
      afterResponse: [this.afterResponse.bind(this)],
      statsContext: data.statsContext,
      signal: data?.signal
    })
  }

  private afterResponse(request: Request, options: NormalizedOptions, response: Response) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modifiedResponse: any = response
    modifiedResponse.request = request
    modifiedResponse.options = options

    this.emit('response', modifiedResponse)
    return modifiedResponse
  }

  private parseResponse(response: unknown): unknown {
    if (response instanceof Response) {
      return (response as ModifiedResponse).data ?? (response as ModifiedResponse).content
    }

    return response
  }

  private parseBatchError(
    error: unknown,
    input: {
      multiStatusResponse: MultiStatusResponse
      invalidPayloadIndices: Set<number>
      batchPayloadLength: number
      filteredPayloads?: JSONLikeObject[]
    }
  ): void {
    if (error instanceof HTTPError) {
      this.fillMultiStatusWithErrorResponse({ ...input, status: error.response.status, errormessage: error.message })
      return
    }

    if (error instanceof IntegrationError) {
      this.fillMultiStatusWithErrorResponse({ ...input, status: error.status ?? 400, errormessage: error.message })
      return
    }

    if (error instanceof RetryableError || error instanceof InvalidAuthenticationError) {
      this.fillMultiStatusWithErrorResponse({ ...input, status: error.status, errormessage: error.message })
      return
    }

    // Throw unhandled errors to be caught by the caller
    throw error
  }

  private fillMultiStatusWithErrorResponse(input: {
    multiStatusResponse: MultiStatusResponse
    invalidPayloadIndices: Set<number>
    batchPayloadLength: number
    status: number
    errormessage: string
    filteredPayloads?: JSONLikeObject[]
  }) {
    const { multiStatusResponse, batchPayloadLength, status, errormessage, filteredPayloads } = input

    let payloadReadIndex = 0
    for (let i = 0; i < batchPayloadLength; i++) {
      if (input.invalidPayloadIndices.has(i)) {
        continue
      }

      multiStatusResponse.setErrorResponseAtIndex(i, {
        status,
        errormessage,
        sent: filteredPayloads ? filteredPayloads[payloadReadIndex++] : {}
      })
    }
  }
}

export class MultiStatusResponse {
  private responses: (ActionDestinationSuccessResponse | ActionDestinationErrorResponse)[] = []

  public length(): number {
    return this.responses.length
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

  public isSuccessResponseAtIndex(index: number): boolean {
    return this.responses[index] instanceof ActionDestinationSuccessResponse
  }

  public isErrorResponseAtIndex(index: number): boolean {
    return this.responses[index] instanceof ActionDestinationErrorResponse
  }

  public getResponseAtIndex(index: number): ActionDestinationSuccessResponse | ActionDestinationErrorResponse {
    return this.responses[index]
  }

  public getAllResponses(): (ActionDestinationSuccessResponse | ActionDestinationErrorResponse)[] {
    return this.responses
  }

  public get successCount(): number {
    return this.responses.filter((r) => r instanceof ActionDestinationSuccessResponse).length
  }

  public get errorCount(): number {
    return this.responses.filter((r) => r instanceof ActionDestinationErrorResponse).length
  }
}
