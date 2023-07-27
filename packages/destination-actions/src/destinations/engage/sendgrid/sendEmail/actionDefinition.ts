import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { apiLookupActionFields } from '../previewApiLookup'
import { SendEmailPerformer } from './SendEmailPerformer'

export const actionDefinition: ActionDefinition<Settings, Payload> = {
  title: 'Send Email',
  description: 'Sends Email to a user powered by SendGrid',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
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
    userId: {
      label: 'User ID',
      description: 'User ID in Segment',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    toEmail: {
      label: 'Test Email',
      description: 'Email to send to when testing',
      type: 'string'
    },
    fromDomain: {
      label: 'From Domain',
      description: 'Verified domain in Sendgrid',
      type: 'string',
      allowNull: true
    },
    fromEmail: {
      label: 'From Email',
      description: 'From Email',
      type: 'string',
      required: true
    },
    fromName: {
      label: 'From Name',
      description: 'From Name displayed to end user email',
      type: 'string',
      required: true
    },
    replyToEqualsFrom: {
      label: 'Reply To Equals From',
      description: 'Whether "reply to" settings are the same as "from"',
      type: 'boolean'
    },
    replyToEmail: {
      label: 'Reply To Email',
      description: 'The Email used by user to Reply To',
      type: 'string',
      required: true
    },
    replyToName: {
      label: 'Reply To Name',
      description: 'The Name used by user to Reply To',
      type: 'string',
      required: true
    },
    bcc: {
      label: 'BCC',
      description: 'BCC list of emails',
      type: 'string',
      required: true
    },
    previewText: {
      label: 'Preview Text',
      description: 'Preview Text',
      type: 'string'
    },
    subject: {
      label: 'Subject',
      description: 'Subject for the email to be sent',
      type: 'string',
      required: true
    },
    body: {
      label: 'Body',
      description: 'The message body',
      type: 'text'
    },
    bodyUrl: {
      label: 'Body URL',
      description: 'URL to the message body',
      type: 'text'
    },
    bodyType: {
      label: 'Body Type',
      description: 'The type of body which is used generally html | design',
      type: 'string',
      required: true
    },
    bodyHtml: {
      label: 'Body Html',
      description: 'The HTML content of the body',
      type: 'string'
    },
    groupId: {
      label: 'Group ID',
      description: 'Subscription group ID',
      type: 'string'
    },
    byPassSubscription: {
      label: 'By Pass Subscription',
      description: 'Send email without subscription check',
      type: 'boolean',
      default: false
    },
    apiLookups: {
      label: 'API Lookups',
      description: 'Any API lookup configs that are needed to send the template',
      type: 'object',
      multiple: true,
      properties: apiLookupActionFields
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
          label: 'subscriptionStatus',
          description: 'The subscription status for the identity.',
          type: 'string'
        },
        unsubscribeLink: {
          label: 'unsubscribeLink',
          description: 'Unsubscribe link for the end user',
          type: 'string'
        },
        preferencesLink: {
          label: 'preferencesLink',
          description: 'Preferences link for the end user',
          type: 'string'
        },
        groups: {
          label: 'Subscription Groups',
          description: 'Subscription groups and their statuses for this id.',
          type: 'object',
          multiple: true,
          properties: {
            id: {
              label: 'Subscription group id',
              type: 'string'
            },
            isSubscribed: {
              label: 'status',
              description: 'Group subscription status true is subscribed, false is unsubscribed or did-not-subscribe',
              // for some reason this still gets deserialized as a string.
              type: 'boolean'
            },
            groupUnsubscribeLink: {
              label: 'groupUnsubscribeLink',
              description: 'Group unsubscribe link for the end user',
              type: 'string'
            }
          }
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
            },
            unsubscribeLink: {
              '@path': '$.unsubscribeLink'
            },
            preferencesLink: {
              '@path': '$.preferencesLink'
            },
            groups: {
              '@path': '$.groups'
            }
          }
        ]
      }
    },
    customArgs: {
      label: 'Custom Args',
      description: 'Additional custom args that we be passed back opaquely on webhook events',
      type: 'object',
      required: false
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
  perform: async (request, executeInput) => {
    const performer = new SendEmailPerformer(request, executeInput)
    return performer.perform()
  }
}
