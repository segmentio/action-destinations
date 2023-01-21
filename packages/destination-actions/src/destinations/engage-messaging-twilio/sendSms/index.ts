import { Liquid as LiquidJs } from 'liquidjs'

import type { ActionDefinition, RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { StatsClient } from '@segment/actions-core/src/destination-kit'
const Liquid = new LiquidJs()

const getProfileApiEndpoint = (environment: string): string => {
  return `https://profiles.segment.${environment === 'production' ? 'com' : 'build'}`
}

type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>

const fetchProfileTraits = async (
  request: RequestFn,
  settings: Settings,
  profileId: string,
  statsClient?: StatsClient | undefined,
  tags?: string[] | undefined
): Promise<Record<string, string>> => {
  try {
    const endpoint = getProfileApiEndpoint(settings.profileApiEnvironment)
    const response = await request(
      `${endpoint}/v1/spaces/${settings.spaceId}/collections/users/profiles/user_id:${profileId}/traits?limit=200`,
      {
        headers: {
          authorization: `Basic ${Buffer.from(settings.profileApiAccessToken + ':').toString('base64')}`,
          'content-type': 'application/json'
        }
      }
    )
    tags?.push(`profile_status_code:${response.status}`)
    statsClient?.incr('actions-personas-messaging-twilio.profile_invoked', 1, tags)
    const body = await response.json()
    return body.traits
  } catch (error: unknown) {
    statsClient?.incr('actions-personas-messaging-twilio.profile_error', 1, tags)
    throw new IntegrationError('Unable to get profile traits for SMS message', 'SMS trait fetch failure', 500)
  }
}

const EXTERNAL_ID_KEY = 'phone'
const DEFAULT_HOSTNAME = 'api.twilio.com'

const DEFAULT_CONNECTION_OVERRIDES = 'rp=all&rc=5'
const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS',
  description: 'Send SMS using Twilio',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'User ID in Segment',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    toNumber: {
      label: 'Test Number',
      description: 'Number to send SMS to when testing',
      type: 'string'
    },
    from: {
      label: 'From',
      description: 'The Twilio Phone Number, Short Code, or Messaging Service to send SMS from.',
      type: 'string',
      required: true
    },
    body: {
      label: 'Message',
      description: 'Message to send',
      type: 'text',
      required: true
    },
    customArgs: {
      label: 'Custom Arguments',
      description: 'Additional custom arguments that will be opaquely sent back on webhook events',
      type: 'object',
      required: false
    },
    connectionOverrides: {
      label: 'Connection Overrides',
      description:
        'Connection overrides are configuration supported by twilio webhook services. Must be passed as fragments on the callback url',
      type: 'string',
      required: false
    },
    send: {
      label: 'Send Message',
      description: 'Whether or not the message should actually get sent.',
      type: 'boolean',
      required: false,
      default: false
    },
    traitEnrichment: {
      label: 'Trait Enrich',
      description: 'Whether or not trait enrich from event (i.e without profile api call)',
      type: 'boolean',
      required: false,
      default: true
    },
    externalIds: {
      label: 'External IDs',
      description: 'An array of user profile identity information.',
      type: 'object',
      multiple: true,
      properties: {
        id: {
          label: 'ID',
          description: 'A unique identifier for the collection.',
          type: 'string'
        },
        type: {
          label: 'type',
          description: 'The external ID contact type.',
          type: 'string'
        },
        subscriptionStatus: {
          label: 'ID',
          description: 'The subscription status for the identity.',
          type: 'string'
        }
      },
      default: {
        '@arrayPath': [
          '$.external_ids',
          {
            id: {
              '@path': '$.id'
            },
            type: {
              '@path': '$.type'
            },
            subscriptionStatus: {
              '@path': '$.isSubscribed'
            }
          }
        ]
      }
    },
    traits: {
      label: 'Traits',
      description: "A user profile's traits",
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    eventOccurredTS: {
      label: 'Event Timestamp',
      description: 'Time of when the actual event happened.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: async (request, { settings, payload, statsContext }) => {
    const statsClient = statsContext?.statsClient
    const tags = statsContext?.tags
    tags?.push(`space_id:${settings.spaceId}`, `projectid:${settings.sourceId}`)
    if (!payload.send) {
      statsClient?.incr('actions-personas-messaging-twilio.send-disabled', 1, tags)
      return
    }
    const externalId = payload.externalIds?.find(({ type }) => type === 'phone')
    if (
      !externalId?.subscriptionStatus ||
      ['unsubscribed', 'did not subscribed', 'false'].includes(externalId.subscriptionStatus)
    ) {
      statsClient?.incr('actions-personas-messaging-twilio.notsubscribed', 1, tags)
      return
    } else if (['subscribed', 'true'].includes(externalId.subscriptionStatus)) {
      statsClient?.incr('actions-personas-messaging-twilio.subscribed', 1, tags)
      const phone = payload.toNumber || externalId.id
      if (!phone) {
        return
      }

      let traits
      if (payload.traitEnrichment) {
        traits = payload?.traits ? payload?.traits : JSON.parse('{}')
      } else {
        traits = await fetchProfileTraits(request, settings, payload.userId, statsClient, tags)
      }

      const profile = {
        user_id: payload.userId,
        phone,
        traits
      }

      // TODO: GROW-259 remove this when we can extend the request
      // and we no longer need to call the profiles API first
      const token = Buffer.from(`${settings.twilioApiKeySID}:${settings.twilioApiKeySecret}`).toString('base64')
      let parsedBody

      try {
        parsedBody = await Liquid.parseAndRender(payload.body, { profile })
      } catch (error: unknown) {
        throw new IntegrationError(`Unable to parse templating in SMS`, `SMS templating parse failure`, 400)
      }

      const body = new URLSearchParams({
        Body: parsedBody,
        From: payload.from,
        To: phone
      })

      const webhookUrl = settings.webhookUrl
      const connectionOverrides = settings.connectionOverrides
      const customArgs: Record<string, string | undefined> = {
        ...payload.customArgs,
        space_id: settings.spaceId,
        __segment_internal_external_id_key__: EXTERNAL_ID_KEY,
        __segment_internal_external_id_value__: phone
      }

      if (webhookUrl && customArgs) {
        // Webhook URL parsing has a potential of failing. I think it's better that
        // we fail out of any invocation than silently not getting analytics
        // data if that's what we're expecting.
        const webhookUrlWithParams = new URL(webhookUrl)
        for (const key of Object.keys(customArgs)) {
          webhookUrlWithParams.searchParams.append(key, String(customArgs[key]))
        }

        webhookUrlWithParams.hash = connectionOverrides || DEFAULT_CONNECTION_OVERRIDES

        body.append('StatusCallback', webhookUrlWithParams.toString())
      }

      const hostname = settings.twilioHostname ?? DEFAULT_HOSTNAME
      const response = await request(
        `https://${hostname}/2010-04-01/Accounts/${settings.twilioAccountSID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            authorization: `Basic ${token}`
          },
          body
        }
      )
      tags?.push(`twilio_status_code:${response.status}`)
      statsClient?.incr('actions-personas-messaging-twilio.response', 1, tags)
      if (payload?.eventOccurredTS != undefined) {
        statsClient?.histogram(
          'actions-personas-messaging-twilio.eventDeliveryTS',
          Date.now() - new Date(payload?.eventOccurredTS).getTime(),
          tags
        )
      }
      return response
    } else {
      statsClient?.incr('actions-personas-messaging-twilio.twilio-error', 1, tags)
      throw new IntegrationError(
        `Failed to recognize the subscriptionStatus in the payload: "${externalId.subscriptionStatus}".`,
        'Invalid subscriptionStatus value',
        400
      )
    }
  }
}

export default action
