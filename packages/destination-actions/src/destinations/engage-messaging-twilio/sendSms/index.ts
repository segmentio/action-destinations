/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { SmsMessageSender } from './sms-sender'
import { WhatsAppMessageSender } from './whatsapp-sender'
import { BaseMessageSender } from './base-sender'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS',
  description: 'Send SMS using Twilio',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    messageType: {
      label: 'Message type (whatsapp or sms)',
      description: 'What type of message is being sent?',
      type: 'string'
    },
    contentSid: {
      label: 'WhatsApp Template ID',
      description: 'If you are sending whatsApp messages, The template you sending for whatsApp',
      type: 'string',
      required: false
    },
    contentVariables: {
      label: 'WhatsApp template variables',
      description: 'Content personalization variables/merge tags for your whatsApp message',
      type: 'string',
      required: false
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

    const messageSenders: Record<string, InstanceType<typeof BaseMessageSender>> = {
      sms: new SmsMessageSender(request, payload, settings, statsClient, tags),
      whatsapp: new WhatsAppMessageSender(request, payload, settings, statsClient, tags)
    }

    if (messageType in messageSenders === false) {
      tags?.push('type:invalid_message_type')
      statsClient?.incr('actions-personas-messaging-twilio.error', 1, tags)
      throw new IntegrationError(
        'The message type supplied is invalid. Message type must be sms or whatsApp.',
        `INVALID_MESSAGE_TYPE`,
        400
      )
    }

    return messageSenders[messageType].send()
  }
}

export default action
