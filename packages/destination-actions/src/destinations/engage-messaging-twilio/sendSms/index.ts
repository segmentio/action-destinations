/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Liquid as LiquidJs } from 'liquidjs'
import type { ActionDefinition, RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { StatsClient } from '@segment/actions-core/src/destination-kit'
import { PhoneNumberFormat } from 'google-libphonenumber'
import { PhoneNumberUtil } from 'google-libphonenumber'

type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>

enum SendabilityStatus {
  NoSenderPhone = 'no_sender_phone',
  ShouldSend = 'should_send',
  DoNotSend = 'do_not_send',
  SendDisabled = 'send_disabled',
  InvalidSubscriptionStatus = 'invalid_subscription_status'
}

type SendabilityPayload = { sendabilityStatus: SendabilityStatus; phone: string | undefined }

type MessageBodyParser = (
  request: RequestFn,
  payload: Payload,
  phone: string,
  profile: any,
  tags?: string[] | undefined,
  statsClient?: StatsClient
) => Promise<URLSearchParams>

// Get an instance of `PhoneNumberUtil`.
const phoneUtil = PhoneNumberUtil.getInstance()

const Liquid = new LiquidJs()

const getProfileApiEndpoint = (environment: string): string => {
  return `https://profiles.segment.${environment === 'production' ? 'com' : 'build'}`
}

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

const getSendabilityPayload = (
  payload: Payload,
  statsClient: StatsClient | undefined,
  tags: string[] | undefined
): SendabilityPayload => {
  const nonSendableStatuses = ['unsubscribed', 'did not subscribed', 'false']
  const sendableStatuses = ['subscribed', 'true']
  const externalId = payload.externalIds?.find(({ type }) => type === 'phone')

  let status: SendabilityStatus

  if (!payload.send) {
    statsClient?.incr('actions-personas-messaging-twilio.send-disabled', 1, tags)
    return { sendabilityStatus: SendabilityStatus.SendDisabled, phone: undefined }
  }

  if (!externalId?.subscriptionStatus || nonSendableStatuses.includes(externalId.subscriptionStatus)) {
    statsClient?.incr('actions-personas-messaging-twilio.notsubscribed', 1, tags)
    status = SendabilityStatus.DoNotSend
  } else if (sendableStatuses.includes(externalId.subscriptionStatus)) {
    statsClient?.incr('actions-personas-messaging-twilio.subscribed', 1, tags)
    status = SendabilityStatus.ShouldSend
  } else {
    statsClient?.incr('actions-personas-messaging-twilio.twilio-error', 1, tags)
    throw new IntegrationError(
      `Failed to recognize the subscriptionStatus in the payload: "${externalId.subscriptionStatus}".`,
      'Invalid subscriptionStatus value',
      400
    )
  }

  const phone = payload.toNumber || externalId?.id
  if (!phone) {
    status = SendabilityStatus.NoSenderPhone
  }

  return { sendabilityStatus: status, phone }
}

const getSmsBody: MessageBodyParser = async (_request, payload, phone, profile) => {
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

  return body
}

const getWhatsAppBody: MessageBodyParser = async (_request, payload, phone, profile, tags, statsClient) => {
  let parsedPhone

  try {
    // Defaulting to US for now as that's where most users will seemingly be. Though
    // any number already given in e164 format should parse correctly even with the
    // default region being US.
    parsedPhone = phoneUtil.parse(phone, 'US')
    parsedPhone = phoneUtil.format(parsedPhone, PhoneNumberFormat.E164)
    parsedPhone = `whatsapp:${parsedPhone}`
  } catch (error: unknown) {
    tags?.push('type:invalid_phone_e164')
    statsClient?.incr('actions-personas-messaging-twilio.error', 1, tags)
    throw new IntegrationError(
      'The string supplied did not seem to be a phone number. Phone number must be able to be formatted to e164 for whatsapp.',
      `INVALID_PHONE`,
      400
    )
  }

  return new URLSearchParams({
    ContentSid: payload.contentSid,
    ContentVariables: payload.contentVariables,
    // TODO: is MessagingServiceSid required here or can we assume 'whatsapp:${payload.from}' works
    From: payload.from,
    To: parsedPhone
  })
}

const EXTERNAL_ID_KEY = 'phone'
const DEFAULT_HOSTNAME = 'api.twilio.com'

const DEFAULT_CONNECTION_OVERRIDES = 'rp=all&rc=5'

// allow extensibility for sms, mms, whatsapp
const messageBodyParsers: Record<string, MessageBodyParser> = Object.freeze({
  sms: getSmsBody,
  whatsapp: getWhatsAppBody
})

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS',
  description: 'Send SMS using Twilio',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    messageType: {
      label: 'Message type (e.g. whatsapp, sms, etc.)',
      description: 'What type of message is being sent?',
      type: 'string'
    },
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
    // Fallback to SMS if messageType is not included
    const messageType = payload.messageType || 'sms'
    const statsClient = statsContext?.statsClient
    const tags = statsContext?.tags
    tags?.push(`space_id:${settings.spaceId}`, `projectid:${settings.sourceId}`)

    if (messageType in messageBodyParsers === false) {
      tags?.push('type:invalid_message_type')
      statsClient?.incr('actions-personas-messaging-twilio.error', 1, tags)
      throw new IntegrationError(
        'The message type supplied is invalid. Message type must be sms or whatsapp.',
        `INVALID_MESSAGE_TYPE`,
        400
      )
    }

    const { phone, sendabilityStatus } = getSendabilityPayload(payload, statsClient, tags)

    if (sendabilityStatus !== SendabilityStatus.ShouldSend || !phone) {
      return
    }

    // TODO: GROW-259 remove this when we can extend the request
    // and we no longer need to call the profiles API first
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

    const body = await messageBodyParsers[messageType](request, payload, phone, profile, tags, statsClient)

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

    const token = Buffer.from(`${settings.twilioApiKeySID}:${settings.twilioApiKeySecret}`).toString('base64')
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
    return response
  }
}

export default action
