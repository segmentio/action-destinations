/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { PushSender } from './push-sender'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Mobile Push Notification',
  description: 'Send a push notification to a mobile device using Twilio',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    contentSid: {
      label: 'Content template Sid',
      description: 'The template to be sent',
      type: 'string',
      required: false
    },
    from: {
      label: 'From',
      description: 'The Push Service Sid to send the push notification from.',
      type: 'string',
      required: true
    },
    customizations: {
      label: 'Customizations',
      description: 'Customizations for the notification',
      type: 'object',
      properties: {
        title: {
          label: 'Notification title',
          description: 'The title to be displayed for your notification',
          type: 'string',
          required: false
        },
        body: {
          label: 'Notification body',
          description: 'The body to be displayed for your notification',
          type: 'string',
          required: false
        },
        media: {
          label: 'Media urls',
          description: 'Media to display to notification',
          type: 'string',
          required: false,
          multiple: true
        },
        tapAction: {
          label: 'Notification open action',
          description: 'Sets the noitfication click action/category',
          type: 'string',
          required: false
        },
        deepLink: {
          label: 'Notification title',
          description: 'Sets the deep link',
          type: 'string',
          required: false
        },
        sound: {
          label: 'Notification sound',
          description: 'Sets the sound played when the notification arrives',
          type: 'string',
          required: false
        },
        priority: {
          label: 'Notification priority',
          description: 'Sets the priority of the message',
          type: 'string',
          required: false,
          choices: [
            { label: 'low', value: 'low' },
            { label: 'high', value: 'high' }
          ]
        },
        badgeAmount: {
          label: 'Badge amount',
          description: 'The badge count which is used in combination with badge strategy to determine the final badge',
          type: 'number',
          required: false
        },
        badgeStrategy: {
          label: 'Badge strategy',
          description: 'Sets the badge count strategy in the notification',
          type: 'string',
          required: false,
          choices: [
            {
              value: 'inc',
              label: 'increment'
            },
            {
              value: 'dec',
              label: 'decrement'
            },
            {
              value: 'set',
              label: 'set'
            }
          ]
        },
        ttl: {
          label: 'Time to live',
          description: 'Sets the time to live for the notification',
          type: 'number',
          required: false
        }
      }
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
  perform: async (request, data) => {
    const { settings, payload, statsContext, logger } = data
    const statsClient = statsContext?.statsClient
    const tags = statsContext?.tags || []
    if (!settings.region) {
      settings.region = 'us-west-1'
    }
    tags.push(`space_id:${settings.spaceId}`, `projectid:${settings.sourceId}`, `region:${settings.region}`)
    return new PushSender(request, payload, settings, statsClient, tags, logger, data).send()
  }
}

export default action
