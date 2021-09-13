import { validate, parseFql, ErrorCondition } from '@segment/destination-subscriptions'
import type { JSONSchema4 } from 'json-schema'
import { Action, ActionDefinition, BaseActionDefinition, RequestFn } from './action'
import { time, duration } from '../time'
import { JSONLikeObject, JSONObject, JSONValue } from '../json-object'
import { SegmentEvent } from '../segment-event'
import { fieldsToJsonSchema, MinimalInputField } from './fields-to-jsonschema'
import createRequestClient, { RequestClient } from '../create-request-client'
import { validateSchema } from '../schema-validation'
import type { ModifiedResponse } from '../types'
import type { GlobalSetting, RequestExtension, ExecuteInput, Result } from './types'
import type { AllRequestOptions } from '../request-client'
import { IntegrationError, InvalidAuthenticationError } from '../errors'
import { AuthTokens, getAuthData, getOAuth2Data, updateOAuthSettings } from './parse-settings'
import { InputData } from '../mapping-kit'
import { retry } from '../retry'

export type { BaseActionDefinition, ActionDefinition, ExecuteInput, RequestFn }
export type { MinimalInputField }
export { fieldsToJsonSchema }

const OAUTH2_SCHEME = 'oauth2'

export interface SubscriptionStats {
  duration: number
  destination: string
  action: string
  subscribe: string
  input: JSONLikeObject
  output: Result[] | null
}

interface PartnerActions<Settings, Payload extends JSONLikeObject> {
  [key: string]: Action<Settings, Payload>
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
  presets?: Subscription[]
}

export interface DestinationDefinition<Settings = unknown> extends BaseDefinition {
  mode: 'cloud'

  /** Actions */
  actions: Record<string, ActionDefinition<Settings>>

  /** An optional function to extend requests sent from the destination (including all actions) */
  extendRequest?: RequestExtension<Settings>

  /** Optional authentication configuration */
  authentication?: AuthenticationScheme<Settings>
}

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
  scheme: 'basic' | 'custom' | 'oauth2'
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuthenticationScheme<Settings = any> =
  | BasicAuthentication<Settings>
  | CustomAuthentication<Settings>
  | OAuth2Authentication<Settings>

interface EventInput<Settings> {
  readonly event: SegmentEvent
  readonly mapping: JSONObject
  readonly settings: Settings
  /** Authentication-related data based on the destination's authentication.fields definition and authentication scheme */
  readonly auth?: AuthTokens
}

interface BatchEventInput<Settings> {
  readonly events: SegmentEvent[]
  readonly mapping: JSONObject
  readonly settings: Settings
  /** Authentication-related data based on the destination's authentication.fields definition and authentication scheme */
  readonly auth?: AuthTokens
}

export interface DecoratedResponse extends ModifiedResponse {
  request: Request
  options: AllRequestOptions
}

interface OnEventOptions {
  onTokenRefresh?: (tokens: RefreshAccessTokenResult) => void
  onComplete?: (stats: SubscriptionStats) => void
}
export class Destination<Settings = JSONObject> {
  readonly definition: DestinationDefinition<Settings>
  readonly name: string
  readonly authentication?: AuthenticationScheme<Settings>
  readonly extendRequest?: RequestExtension<Settings>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly actions: PartnerActions<Settings, any>
  readonly responses: DecoratedResponse[]
  readonly settingsSchema?: JSONSchema4

  constructor(destination: DestinationDefinition<Settings>) {
    this.definition = destination
    this.name = destination.name
    this.extendRequest = destination.extendRequest
    this.actions = {}
    this.authentication = destination.authentication
    this.responses = []

    // Convert to complete JSON Schema
    if (this.authentication?.fields) {
      this.settingsSchema = fieldsToJsonSchema(this.authentication.fields)
    }

    for (const action of Object.keys(destination.actions)) {
      this.partnerAction(action, destination.actions[action])
    }
  }

  async testAuthentication(settings: Settings): Promise<void> {
    const destinationSettings = this.getDestinationSettings(settings as unknown as JSONObject)
    const auth = getAuthData(settings as unknown as JSONObject)
    const data = { settings: destinationSettings, auth }

    const context: ExecuteInput<Settings, undefined> = { settings: destinationSettings, payload: undefined, auth }

    if (this.settingsSchema) {
      validateSchema(settings, this.settingsSchema, { schemaKey: `${this.name}:settings` })
    }

    if (!this.authentication?.testAuthentication) {
      return
    }

    const options = this.extendRequest?.(context) ?? {}
    const requestClient = createRequestClient(options)

    try {
      await this.authentication.testAuthentication(requestClient, data)
    } catch (error) {
      throw new Error('Credentials are invalid')
    }
  }

  refreshAccessToken(
    settings: Settings,
    oauthData: OAuth2ClientCredentials
  ): Promise<RefreshAccessTokenResult> | undefined {
    if (this.authentication?.scheme !== OAUTH2_SCHEME) {
      throw new IntegrationError(
        'refreshAccessToken is only valid with oauth2 authentication scheme',
        'NotImplemented',
        501
      )
    }

    // TODO: clean up context/extendRequest so we don't have to send information that is not needed (payload & cachedFields)
    const context: ExecuteInput<Settings, undefined> = {
      settings,
      payload: undefined,
      auth: getAuthData(settings as unknown as JSONObject)
    }
    const options = this.extendRequest?.(context) ?? {}
    const requestClient = createRequestClient(options)

    if (!this.authentication?.refreshAccessToken) {
      return undefined
    }

    return this.authentication.refreshAccessToken(requestClient, { settings, auth: oauthData })
  }

  private partnerAction(slug: string, definition: ActionDefinition<Settings>): Destination<Settings> {
    const action = new Action<Settings, {}>(this.name, definition, this.extendRequest)

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
    { event, mapping, settings, auth }: EventInput<Settings>
  ): Promise<Result[]> {
    const action = this.actions[actionSlug]
    if (!action) {
      return []
    }

    return action.execute({
      mapping,
      data: event as unknown as InputData,
      settings,
      auth
    })
  }

  public async executeBatch(actionSlug: string, { events, mapping, settings, auth }: BatchEventInput<Settings>) {
    const action = this.actions[actionSlug]
    if (!action) {
      return []
    }

    await action.executeBatch({
      mapping,
      data: events as unknown as InputData[],
      settings,
      auth
    })

    return [{ output: 'successfully processed batch of events' }]
  }

  private async onSubscription(
    subscription: Subscription,
    events: SegmentEvent | SegmentEvent[],
    settings: Settings,
    auth: AuthTokens,
    onComplete?: OnEventOptions['onComplete']
  ): Promise<Result[]> {
    const subscriptionStartedAt = time()
    const actionSlug = subscription.partnerAction
    const input = {
      mapping: subscription.mapping || {},
      settings,
      auth
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

      events = Array.isArray(events) ? events : [events]
      const subscribedEvents = events.filter((event) => validate(parsedSubscription, event))

      if (subscribedEvents.length === 1) {
        return await this.executeAction(actionSlug, { ...input, event: subscribedEvents[0] })
      } else if (subscribedEvents.length > 1) {
        return await this.executeBatch(actionSlug, { ...input, events: subscribedEvents })
      } else {
        results = [{ output: 'not subscribed' }]
        return results
      }
    } catch (error) {
      results = [{ error }]

      if (error.name === 'AggregateAjvError' || error.name === 'ValidationError') {
        error.status = 400
      }

      throw error
    } finally {
      const subscriptionEndedAt = time()
      const subscriptionDuration = duration(subscriptionStartedAt, subscriptionEndedAt)

      onComplete?.({
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

  private async onSubscriptions(
    data: SegmentEvent | SegmentEvent[],
    settings: JSONObject,
    options?: OnEventOptions
  ): Promise<Result[]> {
    const subscriptions = this.getSubscriptions(settings)
    const destinationSettings = this.getDestinationSettings(settings)

    const run = async () => {
      const authData = getAuthData(settings)
      const promises = subscriptions.map((subscription) =>
        this.onSubscription(subscription, data, destinationSettings, authData, options?.onComplete)
      )
      const results = await Promise.all(promises)
      return ([] as Result[]).concat(...results)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFailedAttempt = async (error: any) => {
      const statusCode = error?.status ?? error?.response?.status ?? 500

      // Throw original error if it is unrelated to invalid access tokens and not an oauth2 scheme
      if (!(statusCode === 401 && this.authentication?.scheme === OAUTH2_SCHEME)) {
        throw error
      }

      const oauthSettings = getOAuth2Data(settings)
      const newTokens = await this.refreshAccessToken(destinationSettings, oauthSettings)
      if (!newTokens) {
        throw new InvalidAuthenticationError('Failed to refresh access token')
      }

      // Update `settings` with new tokens
      settings = updateOAuthSettings(settings, newTokens)
      options?.onTokenRefresh?.(newTokens)
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
}
