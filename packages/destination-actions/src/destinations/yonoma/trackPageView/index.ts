import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { TrackPageEventJSON } from './types'
import { TRACK_PAGE_VIEW_URL } from './constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Page View',
  description: 'Log page visits to build behavioral profiles and trigger view-based automations in Yonoma.',
  defaultSubscription: 'type = "page"',
  fields: {
    pageDetails: {
      label: 'Page Details',
      type: 'object',
      description: 'The details of the page being viewed.',
      required: true,
      properties: {
        title: {
          label: 'Page Title',
          type: 'string',
          description: 'Title of the page.'
        },
        url: {
          label: 'Page URL',
          type: 'string',
          description: 'Full URL of the page visited.',
          required: true
        },
        referrer: {
          label: 'Referrer URL',
          type: 'string',
          description: 'URL of the referring page.'
        }
      },
      default: {
        title: { '@path': '$.context.page.title' },
        url: { '@path': '$.context.page.url' },
        referrer: { '@path': '$.context.page.referrer' }
      }
    },
    identifiers: {
      label: 'Identifiers',
      type: 'object',
      description: 'Unique identifiers for the contact. At least one of userId or anonymousId is required.',
      required: true,
      additionalProperties: false,
      properties: {
        userId: {
          label: 'User ID',
          type: 'string',
          description: 'Unique user identifier from your app.'
        },
        anonymousId: {
          label: 'Anonymous ID',
          type: 'string',
          description: 'Anonymous identifier from Segment for tracking pre-identified activity.'
        },
        email: {
          label: 'Email',
          type: 'string',
          description: "Contact's email address. Required if userId is not provided."
        }
      },
      default: {
        userId: { '@path': '$.userId' },
        anonymousId: { '@path': '$.anonymousId' },
        email: {
          '@if': {
            exists: { '@path': '$.context.traits.email' },
            then: { '@path': '$.context.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        }
      }
    },
    listId: {
      label: 'List ID',
      type: 'string',
      description: "The Yonoma list to add the contact to.",
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.list_id' },
          then: { '@path': '$.context.traits.list_id' },
          else: { '@path': '$.properties.list_id' }
        }
      }
    },
    properties: {
      label: 'Event Properties',
      type: 'object',
      description: 'Additional properties associated with the event.',
      required: false,
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.properties' }
    },
    timestamp: {  
      label: 'Timestamp',
      type: 'string',
      description: 'The timestamp of the event. Defaults to the current time if not provided.',
      format: 'date-time',
      default: { '@path': '$.timestamp' }
    }
  },
  perform: async (request, {payload}) => {
    const {
      pageDetails: {
        title,
        url,
        referrer
      } = {},
      listId,
      properties,
      identifiers: {
        userId,
        email,
        anonymousId
      } = {},
      timestamp
    } = payload

    if(!userId && !email && !anonymousId) {
      throw new PayloadValidationError('At least one identifier (userId, email, or anonymousId) is required.')
    }

    delete properties?.email
    delete properties?.list_id

    const json: TrackPageEventJSON = {
      url: url as string,
      ...(referrer ? { referrer } : {}),
      ...(title ? { title } : {}),
      ...(userId ? { userId } : {}),
      ...(anonymousId ? { anonymousId } : {}),
      ...(email ? { email } : {}),
      listId, 
      properties,
      timestamp
    }

    return await request(TRACK_PAGE_VIEW_URL, {
      method: 'POST',
      json
    })
  
  }
}

export default action
