import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import { sendBatch, sendSingle } from '../utils'
import { eventProperties } from '../customerio-properties'

// Reserved Customer.io attributes.
// @see https://docs.customer.io/messaging/channels/subscriptions/set-preferences-outside-center/
const PREFERENCES_ATTRIBUTE = 'cio_subscription_preferences'
const UNSUBSCRIBED_ATTRIBUTE = 'unsubscribed'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Subscription Preferences',
  description:
    "Update a person's subscription preferences in Customer.io: topic and channel preferences used by the subscription center, and the global unsubscribe flag. Only the preferences you send are changed; all others are preserved.",
  defaultSubscription: 'event = "Subscription Preferences Updated"',
  fields: {
    id: {
      label: 'Person ID',
      description:
        'The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description:
        'An optional anonymous ID, used to identify the person when no Person ID or email is provided. [Learn more](https://customer.io/docs/anonymous-events/).',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    email: {
      label: 'Email Address',
      description: "The person's email address, used to identify the person when no Person ID is provided.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    topics: {
      label: 'Topic Preferences',
      description:
        'An object mapping subscription topic IDs to `true` (subscribed) or `false` (unsubscribed), for example `{"topic_1": true, "topic_2": false}`. Keys are topic IDs from your Subscription Center settings, written as `topic_<id>`; bare numeric IDs like `"1"` are converted to `topic_1`. Topics that are not included keep their current preference. [Learn more](https://docs.customer.io/messaging/channels/subscriptions/set-preferences-outside-center/).',
      type: 'object',
      additionalProperties: true,
      default: {
        '@path': '$.properties.topics'
      }
    },
    channels: {
      label: 'Channel Preferences',
      description:
        'An object mapping channel types (`email`, `sms`, `push`, `in_app`, `whatsapp`, `slack`, `line`, `inbox`) to `true` (subscribed) or `false` (unsubscribed), for example `{"sms": false}`. Channels that are not included keep their current preference.',
      type: 'object',
      additionalProperties: true,
      default: {
        '@path': '$.properties.channels'
      }
    },
    unsubscribed: {
      label: 'Globally Unsubscribed',
      description:
        "Sets the person's reserved `unsubscribed` attribute. `true` unsubscribes the person from all messages; `false` resubscribes them. Leave empty to keep the current value.",
      type: 'boolean',
      default: {
        '@path': '$.properties.unsubscribed'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description:
        'A timestamp of when the preferences were changed. Default is current date and time. Used for ordering updates to the person.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    ...eventProperties
  },

  performBatch: (request, { payload: payloads, settings }) => {
    // Payloads without any preference to update, or with invalid topic keys, are dropped rather than failing the
    // whole batch. Per-item reporting belongs with the MultiStatus batch handling.
    const options = payloads
      .map((payload) => {
        try {
          return buildRequestPayload(payload)
        } catch (error) {
          if (error instanceof PayloadValidationError) {
            return undefined
          }
          throw error
        }
      })
      .filter((payload): payload is NonNullable<ReturnType<typeof buildRequestPayload>> => payload !== undefined)
      .map((payload) => ({ action: 'identify', payload, settings, type: 'person' }))

    return sendBatch(request, options)
  },

  perform: (request, { payload, settings }) => {
    const body = buildRequestPayload(payload)

    if (!body) {
      throw new PayloadValidationError(
        'At least one of Topic Preferences, Channel Preferences, or Globally Unsubscribed must be provided.'
      )
    }

    return sendSingle(request, { action: 'identify', payload: body, settings, type: 'person' })
  }
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  return undefined
}

const TOPIC_KEY_PATTERN = /^topic_\d+$/

function normalizeTopicKey(key: string): string {
  return /^\d+$/.test(key) ? `topic_${key}` : key
}

// Customer.io silently discards preference keys that are not `topic_<id>`, so reject them here with a clear
// message instead of returning a 200 for an update that never happens.
function validateTopicKeys(topics: Record<string, unknown> | undefined): void {
  const invalid = Object.keys(topics ?? {})
    .map((key) => normalizeTopicKey(key.trim()))
    .filter((key) => key && !TOPIC_KEY_PATTERN.test(key))

  if (invalid.length > 0) {
    throw new PayloadValidationError(
      `Topic Preferences keys must be Subscription Center topic IDs written as topic_<id> (for example topic_1). Invalid keys: ${invalid.join(
        ', '
      )}.`
    )
  }
}

// Customer.io overwrites every preference when the full `cio_subscription_preferences` object is sent through
// the Track API, but updates only the named preferences when dot-notated keys are used. Emit dot-notated keys so a
// partial update never clobbers preferences that were not part of the event.
function flattenPreferences(
  group: 'topics' | 'channels',
  preferences: Record<string, unknown> | undefined,
  normalizeKey: (key: string) => string = (key) => key
): Record<string, boolean> {
  const attributes: Record<string, boolean> = {}

  for (const [key, value] of Object.entries(preferences ?? {})) {
    const preference = toBoolean(value)
    const normalizedKey = normalizeKey(key.trim())

    if (preference === undefined || !normalizedKey) {
      continue
    }

    attributes[`${PREFERENCES_ATTRIBUTE}.${group}.${normalizedKey}`] = preference
  }

  return attributes
}

function buildRequestPayload(payload: Payload) {
  const { id, topics, channels, unsubscribed, ...rest } = payload

  validateTopicKeys(topics)

  const attributes: Record<string, boolean> = {
    ...flattenPreferences('topics', topics, normalizeTopicKey),
    ...flattenPreferences('channels', channels)
  }

  const unsubscribedValue = toBoolean(unsubscribed)
  if (unsubscribedValue !== undefined) {
    attributes[UNSUBSCRIBED_ATTRIBUTE] = unsubscribedValue
  }

  if (Object.keys(attributes).length === 0) {
    return undefined
  }

  return {
    ...rest,
    person_id: id,
    attributes
  }
}

export default action
