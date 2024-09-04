import { validate, parseFql, ErrorCondition } from '@segment/destination-subscriptions'
import { EventEmitterSlug } from '@segment/action-emitters'
import type { JSONSchema4 } from 'json-schema'
import {
  Action,
  ActionDefinition,
  ActionHookDefinition,
  ActionHookType,
  hookTypeStrings,
  ActionHookResponse,
  BaseActionDefinition,
  RequestFn,
  ExecuteDynamicFieldInput
} from './action'
import { time, duration } from '../time'
import { JSONLikeObject, JSONObject, JSONValue } from '../json-object'
import { SegmentEvent } from '../segment-event'
import { fieldsToJsonSchema, MinimalInputField } from './fields-to-jsonschema'
import createRequestClient, { RequestClient, ResponseError } from '../create-request-client'
import { validateSchema } from '../schema-validation'
import type { ModifiedResponse } from '../types'
import type {
  GlobalSetting,
  RequestExtension,
  ExecuteInput,
  Result,
  Deletion,
  DeletionPayload,
  DynamicFieldResponse
} from './types'
import type { AllRequestOptions } from '../request-client'
import { ErrorCodes, IntegrationError, InvalidAuthenticationError } from '../errors'
import { AuthTokens, getAuthData, getOAuth2Data, updateOAuthSettings } from './parse-settings'
import { InputData, Features } from '../mapping-kit'
import { retry } from '../retry'
import { HTTPError } from '..'

export type {
  BaseActionDefinition,
  ActionDefinition,
  ActionHookDefinition,
  ActionHookResponse,
  ActionHookType,
  ExecuteInput,
  RequestFn
}
export { hookTypeStrings }
export type { MinimalInputField }
export { fieldsToJsonSchema }

export interface SubscriptionStats {
  duration: number
  destination: string
  action: string
  subscribe: string
  input: JSONLikeObject
  output: Result[] | null
}

interface PartnerActions<Settings, Payload extends JSONLikeObject, AudienceSettings = any> {
  [key: string]: Action<Settings, Payload, AudienceSettings>
}

export interface BaseDefinition {
  /** The name of the destination */
  name: string

  /**
   * The mode of the destination
   * 'cloud' mode is made up of actions that run server-side, but can also have device-mode enrichment actions
   * 'device' mode is made up of actions that run in the browser
   */
  mode: 'cloud' | 'device'

  /** A human-friendly description of the destination  */
  description?: string

  /**
   * The url-friendly unique slug for the destination
   * When provided, the `register` command will use this slug
   * instead of generating one from the `name`
   */
  slug?: string

  /** Actions */
  actions: Record<string, BaseActionDefinition>

  /** Subscription presets automatically applied in quick setup */
  presets?: Preset[]
}

export type AudienceResult = {
  externalId: string
}

export type AudienceMode = { type: 'realtime' } | { type: 'synced'; full_audience_sync: boolean }

export type CreateAudienceInput<Settings = unknown, AudienceSettings = unknown> = {
  settings: Settings

  audienceSettings?: AudienceSettings

  audienceName: string

  statsContext?: StatsContext
}

export type GetAudienceInput<Settings = unknown, AudienceSettings = unknown> = {
  settings: Settings

  audienceSettings?: AudienceSettings

  externalId: string

  statsContext?: StatsContext
}

export interface AudienceDestinationConfiguration {
  mode: AudienceMode
}

export interface AudienceDestinationConfigurationWithCreateGet<Settings = unknown, AudienceSettings = unknown>
  extends AudienceDestinationConfiguration {
  createAudience(
    request: RequestClient,
    createAudienceInput: CreateAudienceInput<Settings, AudienceSettings>
  ): Promise<AudienceResult>

  getAudience(
    request: RequestClient,
    getAudienceInput: GetAudienceInput<Settings, AudienceSettings>
  ): Promise<AudienceResult>
}

const instanceOfAudienceDestinationSettingsWithCreateGet = (
  object: any
): object is AudienceDestinationConfigurationWithCreateGet => {
  return 'createAudience' in object && 'getAudience' in object
}

export interface AudienceDestinationDefinition<Settings = unknown, AudienceSettings = unknown>
  extends DestinationDefinition<Settings> {
  audienceConfig:
    | AudienceDestinationConfigurationWithCreateGet<Settings, AudienceSettings>
    | AudienceDestinationConfiguration

  audienceFields: Record<string, GlobalSetting>

  actions: Record<string, ActionDefinition<Settings, any, AudienceSettings>>
}

export interface DestinationDefinition<Settings = unknown> extends BaseDefinition {
  mode: 'cloud'

  /** Actions */
  actions: Record<string, ActionDefinition<Settings>>

  /**
   * An optional function to extend requests sent from the destination
   * (including all actions). Payloads may be any type -- destination authors
   * will need to take that into account when extending requests with the contents
   * of the payload.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extendRequest?: RequestExtension<Settings, any>

  /** Optional authentication configuration */
  authentication?: AuthenticationScheme<Settings>

  onDelete?: Deletion<Settings>
}

interface AutomaticPreset extends Subscription {
  type: 'automatic'
}
interface SpecificEventPreset extends Omit<Subscription, 'subscribe'> {
  type: 'specificEvent'
  eventSlug: EventEmitterSlug
}
export type Preset = AutomaticPreset | SpecificEventPreset

export interface Subscription {
  name?: string
  partnerAction: string
  subscribe: string
  mapping?: JSONObject
}

export interface OAuth2ClientCredentials extends AuthTokens {
  /** Publicly exposed string that is used by the partner API to identify the application, also used to build authorization URLs that are presented to users */
  clientId: string
  /** Used to authenticate the identity of the application to the partner API when the application requests to access a user’s account, must be kept private between the application and the API. */
  clientSecret: string
}

export interface RefreshAccessTokenResult {
  /** OAuth2 access token that was recently acquired */
  accessToken: string
  /** Provide in case the partner API also updates the refresh token when requesting a fresh access token */
  refreshToken?: string
}

interface AuthSettings<Settings> {
  settings: Settings
  auth: AuthTokens
}

interface RefreshAuthSettings<Settings> {
  settings: Settings
  auth: OAuth2ClientCredentials
}

interface Authentication<Settings> {
  /** The authentication scheme */
  scheme: 'basic' | 'custom' | 'oauth2' | 'oauth-managed'
  /** The fields related to authentication */
  fields: Record<string, GlobalSetting>
  /** A function that validates the user's authentication inputs. It is highly encouraged to define this whenever possible. */
  testAuthentication?: (request: RequestClient, input: AuthSettings<Settings>) => Promise<unknown> | unknown
}

/**
 * Custom authentication scheme
 * Typically used for "API Key" authentication.
 */
export interface CustomAuthentication<Settings> extends Authentication<Settings> {
  scheme: 'custom'
}

/**
 * Basic authentication scheme
 * @see {@link https://datatracker.ietf.org/doc/html/rfc7617}
 */
export interface BasicAuthentication<Settings> extends Authentication<Settings> {
  scheme: 'basic'
}

/**
 * OAuth2 authentication scheme
 */
export interface OAuth2Authentication<Settings> extends Authentication<Settings> {
  scheme: 'oauth2'
  /** A function that is used to refresh the access token
   * @todo look into merging input and oauthConfig so we can keep all the request functions with the same method signature (2 arguments)
   */
  refreshAccessToken?: (
    request: RequestClient,
    input: RefreshAuthSettings<Settings>
  ) => Promise<RefreshAccessTokenResult>
}

/**
 * OAuth2 authentication scheme where the credentials and settings are managed by the partner.
 */
export interface OAuthManagedAuthentication<Settings> extends Authentication<Settings> {
  scheme: 'oauth-managed'
  /** A function that is used to refresh the access token
   */
  refreshAccessToken?: (
    request: RequestClient,
    input: RefreshAuthSettings<Settings>
  ) => Promise<RefreshAccessTokenResult>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuthenticationScheme<Settings = any> =
  | BasicAuthentication<Settings>
  | CustomAuthentication<Settings>
  | OAuth2Authentication<Settings>
  | OAuthManagedAuthentication<Settings>

interface EventInput<Settings> {
  readonly event: SegmentEvent
  readonly mapping: JSONObject
  readonly settings: Settings
  /** Authentication-related data based on the destination's authentication.fields definition and authentication scheme */
  readonly auth?: AuthTokens
  /** `features` and `stats` are for internal Segment/Twilio use only. */
  readonly features?: Features
  readonly statsContext?: StatsContext
  readonly logger?: Logger
  readonly dataFeedCache?: DataFeedCache
  readonly transactionContext?: TransactionContext
  readonly stateContext?: StateContext
}

interface BatchEventInput<Settings> {
  readonly events: SegmentEvent[]
  readonly mapping: JSONObject
  readonly settings: Settings
  /** Authentication-related data based on the destination's authentication.fields definition and authentication scheme */
  readonly auth?: AuthTokens
  /** `features` and `stats` are for internal Segment/Twilio use only. */
  readonly features?: Features
  readonly statsContext?: StatsContext
  readonly logger?: Logger
  readonly dataFeedCache?: DataFeedCache
  readonly transactionContext?: TransactionContext
  readonly stateContext?: StateContext
}

export interface DecoratedResponse extends ModifiedResponse {
  request: Request
  options: AllRequestOptions
}

interface OnEventOptions {
  onTokenRefresh?: (tokens: RefreshAccessTokenResult) => Promise<void>
  onComplete?: (stats: SubscriptionStats) => void
  features?: Features
  statsContext?: StatsContext
  logger?: Logger
  readonly dataFeedCache?: DataFeedCache
  transactionContext?: TransactionContext
  stateContext?: StateContext
  /** Handler to perform synchronization. If set, the refresh access token method will be synchronized across
   * all events across multiple instances of the destination using the same account for a given source*/
  synchronizeRefreshAccessToken?: () => Promise<void>
}

/** Transaction variables and setTransaction method are passed from mono service for few Segment built integrations.
 * Transaction context is for Twilio/Segment use only and are not for Partner Builds.
 */
export interface TransactionContext {
  transaction: Record<string, string>
  setTransaction: (key: string, value: string) => void
}

export interface StateContext {
  // getRequestContext reads the `context` field from the request
  getRequestContext(key: string, cb?: (res?: string) => any): any
  // setResponseContext sets values in the `setContext` field in the response
  // values set on the response will be available on subsequent requests
  setResponseContext(key: string, value: string, ttl: { hour?: number; minute?: number; second?: number }): void
}

export interface StatsClient {
  observe: (metric: any) => any
  _name(name: string): string
  _tags(tags?: string[]): string[]
  incr(name: string, value?: number, tags?: string[]): void
  set(name: string, value: number, tags?: string[]): void
  histogram(name: string, value?: number, tags?: string[]): void
}

/** DataDog stats client and tags passed from the `CreateActionDestination`
 * in the monoservice as `options`.
 * See: https://github.com/segmentio/integrations/blob/cbd8f80024eceb2f1229f2bd0c9eb5b204f66c58/createActionDestination/index.js#L205-L208
 */
export interface StatsContext {
  statsClient: StatsClient
  tags: string[]
}

export interface Logger {
  level: string
  name: string
  debug(...message: string[]): void
  info(...message: string[]): void
  warn(...message: string[]): void
  error(...message: string[]): void
  crit(...message: string[]): void
  log(...message: string[]): void
  withTags(extraTags: any): void
}

export interface DataFeedCache {
  setRequestResponse(requestId: string, response: string, expiryInSeconds: number): Promise<void>
  getRequestResponse(requestId: string): Promise<string | null>
  maxResponseSizeBytes: number
  maxExpirySeconds: number
}

export class Destination<Settings = JSONObject, AudienceSettings = JSONObject> {
  readonly definition: DestinationDefinition<Settings>
  readonly name: string
  readonly authentication?: AuthenticationScheme<Settings>
  // Payloads may be any type so we use `any` explicitly here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly extendRequest?: RequestExtension<Settings, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly actions: PartnerActions<Settings, any, AudienceSettings>
  readonly responses: DecoratedResponse[]
  readonly settingsSchema?: JSONSchema4
  onDelete?: (event: SegmentEvent, settings: JSONObject, options?: OnEventOptions) => Promise<Result>

  constructor(destination: DestinationDefinition<Settings>) {
    this.definition = destination
    this.name = destination.name
    this.extendRequest = destination.extendRequest
    this.actions = {}
    this.authentication = destination.authentication
    this.responses = []

    if (this.definition.onDelete) {
      this.onDelete = this._onDelete
    }

    // Convert to complete JSON Schema
    if (this.authentication?.fields) {
      this.settingsSchema = fieldsToJsonSchema(this.authentication.fields)
    }

    for (const action of Object.keys(destination.actions)) {
      this.partnerAction(action, destination.actions[action])
    }
  }

  validateSettings(settings: Settings): void {
    if (this.settingsSchema) {
      try {
        validateSchema(settings, this.settingsSchema, { schemaKey: `${this.name}:settings` })
      } catch (err) {
        const error = err as ResponseError
        if (error.name === 'AggregateAjvError' || error.name === 'ValidationError') {
          error.status = 400
        }

        throw error
      }
    }
  }

  async createAudience(createAudienceInput: CreateAudienceInput<Settings, AudienceSettings>) {
    let settings: JSONObject = createAudienceInput.settings as unknown as JSONObject
    const { audienceConfig } = this.definition as AudienceDestinationDefinition
    if (!instanceOfAudienceDestinationSettingsWithCreateGet(audienceConfig)) {
      throw new Error('Unexpected call to createAudience')
    }
    const destinationSettings = this.getDestinationSettings(settings)
    const run = async () => {
      const auth = getAuthData(settings)
      const context: ExecuteInput<Settings, any, AudienceSettings> = {
        audienceSettings: createAudienceInput.audienceSettings,
        settings: destinationSettings,
        payload: undefined,
        auth
      }
      const opts = this.extendRequest?.(context) ?? {}
      const requestClient = createRequestClient({ ...opts, statsContext: context.statsContext })
      return await audienceConfig?.createAudience(requestClient, createAudienceInput)
    }

    const onFailedAttempt = async (error: ResponseError & HTTPError) => {
      settings = await this.handleAuthError(error, settings)
    }
    return await retry(run, { retries: 2, onFailedAttempt })
  }

  async getAudience(getAudienceInput: GetAudienceInput<Settings, AudienceSettings>) {
    const { audienceConfig } = this.definition as AudienceDestinationDefinition
    let settings: JSONObject = getAudienceInput.settings as unknown as JSONObject
    if (!instanceOfAudienceDestinationSettingsWithCreateGet(audienceConfig)) {
      throw new Error('Unexpected call to getAudience')
    }
    const destinationSettings = this.getDestinationSettings(settings)
    const run = async () => {
      const auth = getAuthData(settings)
      const context: ExecuteInput<Settings, any, AudienceSettings> = {
        audienceSettings: getAudienceInput.audienceSettings,
        settings: destinationSettings,
        payload: undefined,
        auth
      }
      const opts = this.extendRequest?.(context) ?? {}
      const requestClient = createRequestClient({ ...opts, statsContext: context.statsContext })
      return await audienceConfig?.getAudience(requestClient, getAudienceInput)
    }

    const onFailedAttempt = async (error: ResponseError & HTTPError) => {
      settings = await this.handleAuthError(error, settings)
    }

    return await retry(run, { retries: 2, onFailedAttempt })
  }

  async testAuthentication(settings: Settings): Promise<void> {
    const destinationSettings = this.getDestinationSettings(settings as unknown as JSONObject)
    const auth = getAuthData(settings as unknown as JSONObject)
    const data = { settings: destinationSettings, auth }

    const context: ExecuteInput<Settings, any> = {
      settings: destinationSettings,
      payload: undefined,
      auth
    }

    // Validate settings according to the destination's `authentication.fields` schema
    this.validateSettings(destinationSettings)

    if (!this.authentication?.testAuthentication) {
      return
    }

    const options = this.extendRequest?.(context) ?? {}
    const requestClient = createRequestClient({ ...options, statsContext: context.statsContext })

    try {
      await this.authentication.testAuthentication(requestClient, data)
    } catch (error) {
      const statusCode = error?.response?.status ?? ''
      throw new Error(`Credentials are invalid: ${statusCode} ${error.message}`)
    }
  }

  async refreshAccessToken(
    settings: Settings,
    oauthData: OAuth2ClientCredentials,
    synchronizeRefreshAccessToken?: () => Promise<void>
  ): Promise<RefreshAccessTokenResult | undefined> {
    if (!(this.authentication?.scheme === 'oauth2' || this.authentication?.scheme === 'oauth-managed')) {
      throw new IntegrationError(
        'refreshAccessToken is only valid with oauth2 authentication scheme',
        'NotImplemented',
        501
      )
    }

    // TODO: clean up context/extendRequest so we don't have to send information that is not needed (payload & cachedFields)
    const context: ExecuteInput<Settings, any> = {
      settings,
      payload: undefined,
      auth: getAuthData(settings as unknown as JSONObject)
    }
    const options = this.extendRequest?.(context) ?? {}
    const requestClient = createRequestClient({ ...options, statsContext: context.statsContext })

    if (!this.authentication?.refreshAccessToken) {
      return undefined
    }

    // Invoke synchronizeRefreshAccessToken handler if synchronizeRefreshAccessToken option is passed.
    // This will ensure that there is only one active refresh happening at a time.
    await synchronizeRefreshAccessToken?.()
    return this.authentication.refreshAccessToken(requestClient, { settings, auth: oauthData })
  }

  private partnerAction(
    slug: string,
    definition: ActionDefinition<Settings, any, AudienceSettings>
  ): Destination<Settings, AudienceSettings> {
    const action = new Action<Settings, {}, AudienceSettings>(this.name, definition, this.extendRequest)

    action.on('response', (response) => {
      if (response) {
        this.responses.push(response)
      }
    })

    this.actions[slug] = action

    return this
  }

  protected async executeAction(
    actionSlug: string,
    {
      event,
      mapping,
      settings,
      auth,
      features,
      statsContext,
      logger,
      dataFeedCache,
      transactionContext,
      stateContext
    }: EventInput<Settings>
  ): Promise<Result[]> {
    const action = this.actions[actionSlug]
    if (!action) {
      return []
    }

    let audienceSettings = {} as AudienceSettings
    if (event.context?.personas) {
      audienceSettings = event.context?.personas?.audience_settings as AudienceSettings
    }

    return action.execute({
      mapping,
      data: event as unknown as InputData,
      settings,
      audienceSettings,
      auth,
      features,
      statsContext,
      logger,
      dataFeedCache,
      transactionContext,
      stateContext
    })
  }

  public async executeBatch(
    actionSlug: string,
    {
      events,
      mapping,
      settings,
      auth,
      features,
      statsContext,
      logger,
      dataFeedCache,
      transactionContext,
      stateContext
    }: BatchEventInput<Settings>
  ) {
    const action = this.actions[actionSlug]
    if (!action) {
      return []
    }

    let audienceSettings = {} as AudienceSettings
    // All events should be batched on the same audience
    if (events[0].context?.personas) {
      audienceSettings = events[0].context?.personas?.audience_settings as AudienceSettings
    }

    await action.executeBatch({
      mapping,
      data: events as unknown as InputData[],
      settings,
      audienceSettings,
      auth,
      features,
      statsContext,
      logger,
      dataFeedCache,
      transactionContext,
      stateContext
    })

    return [{ output: 'successfully processed batch of events' }]
  }

  public async executeDynamicField(
    actionSlug: string,
    fieldKey: string,
    data: ExecuteDynamicFieldInput<Settings, object>,
    /**
     * The dynamicFn argument is optional since it is only used by dynamic hook input fields. (For now)
     */
    dynamicFn?: RequestFn<Settings, any, DynamicFieldResponse, AudienceSettings>
  ) {
    const action = this.actions[actionSlug]
    if (!action) {
      return []
    }

    return action.executeDynamicField(fieldKey, data, dynamicFn)
  }

  private async onSubscription(
    subscription: Subscription,
    events: SegmentEvent | SegmentEvent[],
    settings: Settings,
    auth: AuthTokens,
    options?: OnEventOptions
  ): Promise<Result[]> {
    const subscriptionStartedAt = time()
    const actionSlug = subscription.partnerAction
    const input = {
      mapping: subscription.mapping || {},
      settings,
      auth,
      features: options?.features || {},
      statsContext: options?.statsContext || ({} as StatsContext),
      logger: options?.logger,
      dataFeedCache: options?.dataFeedCache,
      transactionContext: options?.transactionContext,
      stateContext: options?.stateContext
    }

    let results: Result[] | null = null

    try {
      if (!subscription.subscribe || typeof subscription.subscribe !== 'string') {
        results = [{ output: 'invalid subscription' }]
        return results
      }

      const parsedSubscription = parseFql(subscription.subscribe)

      if ((parsedSubscription as ErrorCondition).error) {
        results = [{ output: `invalid subscription : ${(parsedSubscription as ErrorCondition).error.message}` }]
        return results
      }

      const isBatch = Array.isArray(events)
      const allEvents = (isBatch ? events : [events]) as SegmentEvent[]
      const subscribedEvents = allEvents.filter((event) => validate(parsedSubscription, event))

      if (subscribedEvents.length === 0) {
        results = [{ output: 'not subscribed' }]
        return results
      } else if (isBatch) {
        return await this.executeBatch(actionSlug, { ...input, events: subscribedEvents })
      } else {
        // there should only be 1 item in the subscribedEvents array
        return await this.executeAction(actionSlug, { ...input, event: subscribedEvents[0] })
      }
    } catch (err) {
      const error = err as ResponseError
      results = [{ error: { message: error.message } }]

      if (error.name === 'AggregateAjvError' || error.name === 'ValidationError') {
        error.status = 400
      }

      throw error
    } finally {
      const subscriptionEndedAt = time()
      const subscriptionDuration = duration(subscriptionStartedAt, subscriptionEndedAt)

      options?.onComplete?.({
        duration: subscriptionDuration,
        destination: this.name,
        action: actionSlug,
        subscribe: subscription.subscribe,
        input: {
          data: events as unknown as JSONValue,
          mapping: input.mapping,
          settings: input.settings as unknown as JSONLikeObject
        },
        output: results
      })
    }
  }

  /** Pass a single event to 0 or more subscriptions */
  public onEvent(event: SegmentEvent, settings: JSONObject, options?: OnEventOptions): Promise<Result[]> {
    return this.onSubscriptions(event, settings, options)
  }

  /** Pass a batch of events to 0 or more subscriptions */
  public onBatch(events: SegmentEvent[], settings: JSONObject, options?: OnEventOptions): Promise<Result[]> {
    return this.onSubscriptions(events, settings, options)
  }

  /** Pass a single deletion event to the destination for execution
   * note that this method is conditionally added if the destination supports it
   */
  private async _onDelete(event: SegmentEvent, settings: JSONObject, options?: OnEventOptions): Promise<Result> {
    const { userId, anonymousId } = event
    const payload = { userId, anonymousId }
    const destinationSettings = this.getDestinationSettings(settings as unknown as JSONObject)
    this.validateSettings(destinationSettings)

    const run = async () => {
      const auth = getAuthData(settings as unknown as JSONObject)
      const data: ExecuteInput<Settings, DeletionPayload> = {
        payload,
        settings: destinationSettings,
        auth
      }
      const context: ExecuteInput<Settings, any> = {
        settings: destinationSettings,
        payload,
        auth
      }
      const opts = this.extendRequest?.(context) ?? {}
      const requestClient = createRequestClient({ ...opts, statsContext: context.statsContext })
      const deleteResult = await this.definition.onDelete?.(requestClient, data)
      const result: Result = deleteResult ?? { output: 'no onDelete defined' }

      return result
    }

    const onFailedAttempt = async (error: ResponseError & HTTPError) => {
      settings = await this.handleAuthError(error, settings, options)
    }

    return await retry(run, { retries: 2, onFailedAttempt })
  }

  private async onSubscriptions(
    data: SegmentEvent | SegmentEvent[],
    settings: JSONObject,
    options?: OnEventOptions
  ): Promise<Result[]> {
    const subscriptions = this.getSubscriptions(settings)
    const destinationSettings = this.getDestinationSettings(settings)

    // Validate settings according to the destination's `authentication.fields` schema
    this.validateSettings(destinationSettings)

    const run = async () => {
      const authData = getAuthData(settings)
      const promises = subscriptions.map((subscription) =>
        this.onSubscription(subscription, data, destinationSettings, authData, options)
      )
      const results = await Promise.all(promises)
      return ([] as Result[]).concat(...results)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFailedAttempt = async (error: any) => {
      settings = await this.handleAuthError(error, settings, options)
    }

    return await retry(run, { retries: 2, onFailedAttempt })
  }

  private getSubscriptions(settings: JSONObject): Subscription[] {
    // Support receiving:
    // - a single subscription (e.g. via a Centrifuge job)
    // - a list of subscriptions (e.g. via Event Tester or local testing)
    const { subscription, subscriptions } = settings
    let parsedSubscriptions: unknown

    if (subscription) {
      parsedSubscriptions = [subscription]
    } else if (Array.isArray(subscriptions)) {
      parsedSubscriptions = subscriptions
    } else {
      parsedSubscriptions = []
    }

    return parsedSubscriptions as Subscription[]
  }

  private getDestinationSettings(settings: JSONObject): Settings {
    const { subcription, subscriptions, oauth, ...otherSettings } = settings
    return otherSettings as unknown as Settings
  }

  /**
   * Handles the failed attempt by checking if reauthentication is needed and updating the token if necessary.
   * @param {ResponseError & HTTPError} error - The error object from the failed attempt.
   * @param {JSONObject} settings - The current settings object.
   * @returns {Promise<JSONObject>} - The updated settings object.
   * @throws {ResponseError & HTTPError} - If reauthentication is not needed or token refresh fails.
   */
  async handleAuthError(error: ResponseError & HTTPError, settings: JSONObject, options?: OnEventOptions) {
    const statusCode = error?.status ?? error?.response?.status ?? 500
    const needsReauthentication =
      statusCode === 401 &&
      (this.authentication?.scheme === 'oauth2' || this.authentication?.scheme === 'oauth-managed')
    if (!needsReauthentication) {
      throw error
    }
    const newTokens = await this.refreshTokenAndGetNewToken(settings, options)
    // Update new access-token in cache and in settings.
    await options?.onTokenRefresh?.(newTokens)
    settings = updateOAuthSettings(settings, newTokens)
    return settings
  }

  /**
   * Refreshes the token and retrieves new tokens.
   * @param {JSONObject} settings - The current settings object.
   * @param {OnEventOptions} [options] - Optional event options for synchronizing token refresh.
   * @returns {Promise<RefreshAccessTokenResult>} - The new tokens object.
   * @throws {InvalidAuthenticationError} - If token refresh fails.
   */
  async refreshTokenAndGetNewToken(settings: JSONObject, options?: OnEventOptions): Promise<RefreshAccessTokenResult> {
    const destinationSettings = this.getDestinationSettings(settings)
    const oauthSettings = getOAuth2Data(settings)
    const newTokens = await this.refreshAccessToken(
      destinationSettings,
      oauthSettings,
      options?.synchronizeRefreshAccessToken
    )

    if (!newTokens) {
      throw new InvalidAuthenticationError('Failed to refresh access token', ErrorCodes.OAUTH_REFRESH_FAILED)
    }

    return newTokens
  }
}
