/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SmsMessageSender } from './SmsMessageSender'

export const actionDefinition: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS',
  description: 'Send SMS using Twilio',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'User ID in Segment',
      type: 'string',
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
      required: false
    },
    media: {
      label: 'Media Urls',
      description: 'Media to attach to message',
      type: 'string',
      required: false,
      multiple: true
    },
    contentSid: {
      label: 'SMS content template SID',
      description: 'Content template SID for Twilio Content API',
      type: 'string',
      required: false
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
        channelType: {
          label: 'type',
          description: 'The external ID contact channel type (SMS, WHATSAPP, etc).',
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
            channelType: {
              '@path': '$.channelType'
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
    },
    messageId: {
      type: 'string',
      required: false,
      description: 'The Segment messageId',
      label: 'MessageId',
      default: { '@path': '$.messageId' }
    }
  },
  perform: async (request, data) => {
    return new SmsMessageSender(request, data).perform()
  }
}
