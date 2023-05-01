import { ActionDefinition, omit, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ProjectConfig } from '../types'
import { buildVisitorAttributes, getEventId, getEventKeys } from './functions'
import dayjs from '../../../lib/dayjs'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track Conversion Events',
  defaultSubscription: 'type = "track"',
  fields: {
    eventKey: {
      label: 'Event Key',
      type: 'string',
      description:
        'The key of the event to be tracked. This key must match the event key provided when the event was created in the Optimizely app.',
      required: true,
      dynamic: true,
      default: {
        '@path': '$.event'
      }
    },
    userId: {
      label: 'User ID',
      type: 'string',
      description:
        'The ID of the user associated with the event being tracked. **Important**: This ID must match the user ID provided to Activate or Is Feature Enabled.',
      required: true,
      default: {
        '@if': {
          exists: {
            '@path': '$.userId'
          },
          then: {
            '@path': '$.userId'
          },
          else: {
            '@path': '$.anonymousId'
          }
        }
      }
    },
    attributes: {
      label: 'Event Attributes',
      type: 'object',
      description:
        'A map of custom key-value string pairs specifying attributes for the user that are used for results segmentation.',
      required: false,
      default: {
        '@path': '$.context.traits'
      }
    },
    revenue: {
      label: 'Revenue',
      type: 'integer',
      description:
        'An integer value that is used to track the revenue metric for your experiments, aggregated across all conversion events.',
      required: false,
      default: {
        '@path': '$.properties.revenue'
      }
    },
    value: {
      label: 'Value',
      type: 'number',
      description:
        'A floating point value that is used to track a custom value for your experiments. Use this to pass the value for numeric metrics.',
      required: false,
      default: {
        '@path': '$.properties.value'
      }
    },
    eventTags: {
      label: 'Event Tags',
      type: 'object',
      description: `A map of key-value pairs specifying tag names and their corresponding tag values for this particular event occurrence. Values can be strings, numbers, or booleans.
      These can be used to track numeric metrics, allowing you to track actions beyond conversions, for example: revenue, load time, or total value. See details on reserved tag keys.
      `,
      default: {
        '@path': '$.properties'
      },
      required: false
    },
    timestamp: {
      label: 'Timestamp',
      type: 'datetime',
      description: 'Timestamp of the event',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    uuid: {
      label: 'Unique ID',
      type: 'hidden',
      description: 'Unique ID for the event',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    }
  },
  dynamicFields: {
    eventKey: async (request, { settings }) => {
      return getEventKeys(request, settings)
    }
  },
  perform: async (request, { settings, payload }) => {
    const result = await request<ProjectConfig>(settings.dataFileUrl)
    const dataFile = result.data
    const eventId = getEventId(dataFile, payload.eventKey)

    if (!eventId) {
      throw new PayloadValidationError(`Event with name ${payload.eventKey} is not defined`)
    }
    // omit revenue and value from eventTags
    const eventTags = omit(payload.eventTags, ['revenue', 'value'])
    const visitors = [
      {
        snapshots: [
          {
            events: [
              {
                entity_id: eventId,
                timestamp: dayjs.utc(payload.timestamp).valueOf(),
                uuid: payload.uuid,
                key: payload.eventKey,
                revenue: payload.revenue,
                value: payload.value,
                tags: eventTags
              }
            ],
            decisions: []
          }
        ],
        visitor_id: payload.userId,
        attributes: buildVisitorAttributes(dataFile, payload.attributes)
      }
    ]

    if (typeof dataFile.botFiltering === 'boolean') {
      visitors[0].attributes.push({
        entity_id: '$opt_bot_filtering',
        key: '$opt_bot_filtering',
        type: 'custom',
        value: dataFile.botFiltering
      })
    }

    await request('https://logx.optimizely.com/v1/events', {
      method: 'POST',
      json: {
        account_id: dataFile.accountId,
        anonymize_ip: dataFile.anonymizeIP,
        client_name: 'Segment',
        enrich_decisions: true,
        visitors: [...visitors]
      }
    })
  }
}

export default action
