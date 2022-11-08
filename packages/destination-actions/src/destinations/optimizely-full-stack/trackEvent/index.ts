import { ActionDefinition, omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ProjectConfig, VisitorAttribute, Event } from '../types'
import reduceRight from 'lodash/reduceRight'
import { IntegrationError } from '@segment/actions-core'
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
      label: 'Attributes',
      type: 'object',
      description:
        'A map of custom key-value string pairs specifying attributes for the user that are used for results segmentation. Non-string values are only supported in the 3.0 SDK and above.',
      required: false,
      default: {
        '@path': '$.context.traits'
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
      type: 'hidden',
      description: 'Timestamp of the event',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    eventId: {
      label: 'Event ID',
      type: 'string',
      description: 'Unique ID for the event',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    const result = await request<ProjectConfig>(settings.dataFileUrl)
    const dataFile = result.data

    const eventId = getEventId(dataFile, payload.eventKey)

    if (!eventId) {
      throw new IntegrationError(`Event with name ${payload.eventKey} is not defined`)
    }
    const revenue = payload.eventTags ? payload.eventTags['revenue'] : undefined
    const value = payload.eventTags ? payload.eventTags['value'] : undefined
    const eventTags = omit(payload.eventTags, ['revenue', 'value'])
    const visitors = [
      {
        snapshots: [
          {
            events: [
              {
                entity_id: eventId,
                timestamp: dayjs.utc(payload.timestamp).valueOf(),
                uuid: payload.eventId,
                key: payload.eventKey,
                revenue,
                value,
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
        client_version: '1.0.01',
        enrich_decisions: true,
        visitors: [...visitors]
      }
    })
  }
}

function buildVisitorAttributes(
  configObj: ProjectConfig,
  userAttributes?: { [key: string]: unknown }
): VisitorAttribute[] {
  if (!userAttributes) return []
  const attributeKeyMap: Record<string, { id: string; key: string }> = reduceRight(
    configObj.attributes,
    (prev, curr) => {
      return Object.assign(prev, {
        [curr.key]: curr
      })
    },
    {}
  )

  return (
    Object.keys(userAttributes)
      .filter((key) => Object.prototype.hasOwnProperty.call(attributeKeyMap, key))
      // filter out keys with values of type 'object'
      .filter((key) => isValidValue(userAttributes[key]))
      .map((key) => ({
        entity_id: attributeKeyMap[key].id,
        key: key,
        value: userAttributes[key] as string | number | boolean,
        type: 'custom'
      }))
  )
}

function getEventId(configObj: ProjectConfig, eventKey: string) {
  const eventMap: Record<string, Event> = reduceRight(
    configObj.events,
    (prev, curr) => {
      return Object.assign(prev, {
        [curr.key]: curr
      })
    },
    {}
  )
  if (eventMap[eventKey]) {
    return eventMap[eventKey].id
  }
}

function isValidValue(value: unknown) {
  return ['string', 'number', 'boolean'].includes(typeof value)
}

export default action
