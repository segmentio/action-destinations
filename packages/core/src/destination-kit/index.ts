import { validate, parseFql, ErrorCondition } from '@segment/destination-subscriptions'
import { JSONSchema4 } from 'json-schema'
import { Action, ActionDefinition, Validate, RequestFn } from './action'
import { ExecuteInput, StepResult } from './step'
import { time, duration } from '../time'
import { JSONLikeObject, JSONObject } from '../json-object'
import { SegmentEvent } from '../segment-event'
import { fieldsToJsonSchema } from './fields-to-jsonschema'
import createRequestClient, { RequestClient } from '../create-request-client'
import type { ModifiedResponse } from '../types'
import type { InputField, RequestExtension } from './types'
import type { AllRequestOptions } from '../request-client'
import { IntegrationError } from '../errors'

export type { ActionDefinition, ExecuteInput, RequestFn }
export { fieldsToJsonSchema }

export interface SubscriptionStats {
  duration: number
  destination: string
  action: string
  subscribe: string
  state: string
  input: JSONLikeObject
  output: StepResult[] | null
}

interface PartnerActions<Settings, Payload extends JSONLikeObject> {
  [key: string]: Action<Settings, Payload>
}

export interface DestinationDefinition<Settings = unknown> {
  /** The name of the destination */
  name: string
  /** A human-friendly description of the destination  */
  description?: string
  /**
   * The url-friendly unique slug for the destination
   * When provided, the `register` command will use this slug
   * instead of generating one from the `name`
   */
  slug?: string
  /** An optional function to extend requests sent from the destination (including all actions) */
  extendRequest?: RequestExtension<Settings>
  /** Optional authentication configuration */
  authentication?: AuthenticationScheme<Settings>
  /** Actions */
  actions: {
    [key: string]: ActionDefinition<Settings>
  }
  /** Subscription presets automatically applied in quick setup */
  presets?: Subscription[]
}

export interface Subscription {
  name?: string
  partnerAction: string
  subscribe: string
  mapping?: JSONObject
}

export interface OAuth2ClientCredentials {
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
}

interface Authentication<Settings> {
  /** The authentication scheme */
  scheme: 'basic' | 'custom' | 'oauth2'
  /** The fields related to authentication */
  fields: Record<string, InputField>
  /** A function that validates the user's authentication inputs */
  testAuthentication: (request: RequestClient, input: AuthSettings<Settings>) => Promise<unknown> | unknown
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
    input: AuthSettings<Settings>,
    oauthConfig: OAuth2ClientCredentials
  ) => Promise<RefreshAccessTokenResult> | undefined
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
}

export interface DecoratedResponse extends ModifiedResponse {
  request: Request
  options: AllRequestOptions
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
    const context: ExecuteInput<Settings, {}> = { settings, payload: {}, cachedFields: {} }

    if (this.settingsSchema) {
      const step = new Validate('settings', this.settingsSchema)
      await step.executeStep(context)
    }

    if (!this.authentication?.testAuthentication) {
      return
    }

    const options = this.extendRequest?.(context) ?? {}
    const requestClient = createRequestClient(options)

    try {
      await this.authentication.testAuthentication(requestClient, { settings })
    } catch (error) {
      throw new Error('Credentials are invalid')
    }
  }

  refreshAccessToken(
    settings: Settings,
    oauthClientCredentials: OAuth2ClientCredentials
  ): Promise<RefreshAccessTokenResult> | undefined {
    if (this.authentication?.scheme !== 'oauth2') {
      throw new IntegrationError(
        'refreshAccessToken is only valid with oauth2 authentication scheme',
        'NotImplemented',
        501
      )
    }
    // TODO: clean up context/extendRequest so we don't have to send information that is not needed (payload & cachedFields)
    const context: ExecuteInput<Settings, {}> = { settings, payload: {}, cachedFields: {} }
    const options = this.extendRequest?.(context) ?? {}
    const requestClient = createRequestClient(options)

    if (!this.authentication?.refreshAccessToken) {
      return undefined
    }

    return this.authentication.refreshAccessToken(requestClient, { settings }, oauthClientCredentials)
  }

  private partnerAction(slug: string, definition: ActionDefinition<Settings>): Destination<Settings> {
    const action = new Action<Settings, {}>(definition, this.extendRequest)

    action.on('response', (response) => {
      if (response) {
        this.responses.push(response)
      }
    })

    this.actions[slug] = action

    return this
  }

  protected executeAction(
    actionSlug: string,
    { event, mapping, settings }: EventInput<Settings>
  ): Promise<StepResult[]> {
    const action = this.actions[actionSlug]
    if (!action) {
      return Promise.resolve([])
    }

    return action.execute({
      cachedFields: {},
      mapping,
      payload: event,
      settings
    })
  }

  private async onSubscription(
    subscription: Subscription,
    event: SegmentEvent,
    settings: Settings,
    onComplete?: (stats: SubscriptionStats) => void
  ): Promise<StepResult[]> {
    const subscriptionStartedAt = time()
    const actionSlug = subscription.partnerAction
    const input = {
      event,
      mapping: subscription.mapping || {},
      settings
    }

    let state = 'pending'
    let results: StepResult[] | null = null

    try {
      if (!subscription.subscribe || typeof subscription.subscribe !== 'string') {
        state = 'skipped'
        results = [{ output: 'invalid subscription' }]
        return results
      }

      const parsedSubscription = parseFql(subscription.subscribe)

      if ((parsedSubscription as ErrorCondition).error) {
        state = 'skipped'
        results = [{ output: `invalid subscription : ${(parsedSubscription as ErrorCondition).error.message}` }]
        return results
      }

      const isSubscribed = validate(parsedSubscription, event)
      if (!isSubscribed) {
        state = 'skipped'
        results = [{ output: 'not subscribed' }]
        return results
      }

      results = await this.executeAction(actionSlug, input)
      state = 'done'

      return results
    } catch (error) {
      state = 'errored'
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
        state,
        input: {
          event: input.event as unknown as JSONLikeObject,
          mapping: input.mapping,
          settings: input.settings as unknown as JSONLikeObject
        },
        output: results
      })
    }
  }

  /**
   * Note: Until we move subscriptions upstream (into int-consumer) we've opted
   * to have failures abort the set of subscriptions and get potentially retried by centrifuge
   */
  public async onEvent(
    event: SegmentEvent,
    settings: JSONObject,
    onComplete?: (stats: SubscriptionStats) => void
  ): Promise<StepResult[]> {
    const subscriptions = this.getSubscriptions(settings)
    const destinationSettings = this.getDestinationSettings(settings)

    const promises = subscriptions.map((subscription) =>
      this.onSubscription(subscription, event, destinationSettings, onComplete)
    )

    const results = await Promise.all(promises)

    return ([] as StepResult[]).concat(...results)
  }

  private getSubscriptions(settings: JSONObject): Subscription[] {
    const { subscription, subscriptions } = settings
    let parsedSubscriptions

    // To support event tester we need to parse and validate multiple subscriptions from the settings
    if (subscription) {
      parsedSubscriptions = [subscription]
    } else if (typeof subscriptions === 'string') {
      parsedSubscriptions = JSON.parse(subscriptions)
    } else if (Array.isArray(subscriptions)) {
      parsedSubscriptions = subscriptions
    } else {
      parsedSubscriptions = []
    }

    return parsedSubscriptions as Subscription[]
  }

  private getDestinationSettings(settings: JSONObject): Settings {
    const { subcription, subscriptions, ...otherSettings } = settings
    return otherSettings as unknown as Settings
  }
}
