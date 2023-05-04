/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { PushSender } from './push-sender'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Push Notification',
  description: 'Send a push notification using Twilio',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    contentSid: {
      label: 'Content template Sid',
      description: 'The template you sending',
      type: 'string',
      required: true
    },
    from: {
      label: 'From',
      description: 'The Push Service Sid to send the push noitification from.',
      type: 'string',
      required: true
    },
    title: {
      label: 'Notification title',
      description: 'The title to be displayed for your notification',
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
      label: 'Send Notification',
      description: 'Whether or not the notification should actually get sent.',
      type: 'boolean',
      required: false,
      default: false
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
    }
  },
  perform: async (request, { settings, payload, statsContext, logger }) => {
    const statsClient = statsContext?.statsClient
    const tags = statsContext?.tags || []
    if (!settings.region) {
      settings.region = 'us-west-1'
    }
    tags.push(`space_id:${settings.spaceId}`, `projectid:${settings.sourceId}`, `region:${settings.region}`)
    if (!payload.send) {
      statsClient?.incr('actions-personas-messaging-twilio.send-disabled', 1, tags)
      return
    }
    return new PushSender(request, payload, settings, statsClient, tags, logger).send()
  }
}

export default action
