import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { TrackEventJSON } from './types'
import { TRACK_EVENT_URL } from './constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Capture behavioral events for both known and anonymous users to build a complete activity timeline in Yonoma.',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the event to track.',
      required: true,
      default: { '@path': '$.event' }
    },
    identifiers: {
      label: 'Identifiers',
      type: 'object',
      description: 'Unique identifiers for the contact. User ID and email are required. Anonymous ID is optional.',
      required: true,
      additionalProperties: false,
      properties: {
        userId: {
          label: 'User ID',
          type: 'string',
          description: 'Unique user identifier from your app.',
          required: true
        },
        anonymousId: {
          label: 'Anonymous ID',
          type: 'string',
          description: 'Anonymous identifier from Segment for tracking pre-identified activity.'
        },
        email: {
          label: 'Email',
          type: 'string',
          description: "Contact's email address.",
          required: true
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
    timestamp: {  
      label: 'Timestamp',
      type: 'string',
      description: 'The timestamp of the event. Defaults to the current time if not provided.',
      format: 'date-time',
      default: { '@path': '$.timestamp' }
    },
    ip: {  
      label: 'IP Address',
      type: 'string',
      description: 'The IP address of the user. Defaults to the current user IP if not provided.',
      default: { '@path': '$.context.ip' }
    },
    userAgent: {
      label: 'User Agent',
      type: 'string',
      description: 'The user agent of the user.',
      default: { '@path': '$.context.userAgent' }
    },
    page: {
      label: 'Page',
      type: 'object',
      description: 'The details of the page being viewed.',
      properties: {
        url: {
          label: 'Page URL',
          type: 'string',
          description: 'Full URL of the page visited.'
        },
        title: {
          label: 'Page Title',
          type: 'string',
          description: 'Title of the page.'
        },
        referrer: {
          label: 'Referrer URL',
          type: 'string',
          description: 'URL of the referring page.'
        },
        path: {
          label: 'Page Path',
          type: 'string',
          description: 'Path of the page being viewed.'
        },
        search: {
          label: 'Search Query',
          type: 'string',
          description: 'Search query used to find the page.'
        }
      },
      default: {
        title: { '@path': '$.context.page.title' },
        url: { '@path': '$.context.page.url' },
        referrer: { '@path': '$.context.page.referrer' },
        path: { '@path': '$.context.page.path' },
        search: { '@path': '$.context.page.search' }
      }
    },
    campaign: {
      label: 'Campaign',
      type: 'object',
      description: 'The marketing campaign that referred the user to the site.',
      properties: {
        name: {
          label: 'UTM Campaign Name',
          type: 'string',
          description: 'Name of the campaign.'
        },
        source: {
          label: 'UTM Campaign Source',
          type: 'string',
          description: 'Source of the campaign UTM parameter.'
        },
        medium: {
          label: 'UTM Campaign Medium',
          type: 'string',
          description: 'Medium of the campaign UTM parameter.'
        },
        term: {
          label: 'UTM Campaign Term',
          type: 'string',
          description: 'Term or keyword of the campaign UTM parameter.'
        },
        content: {
          label: 'UTM Campaign Content',
          type: 'string',
          description: 'Content of the campaign UTM parameter.'
        }
      },
      default: {
        name: { '@path': '$.context.campaign.name' },
        source: { '@path': '$.context.campaign.source' },
        medium: { '@path': '$.context.campaign.medium' },
        term: { '@path': '$.context.campaign.term' },
        content: { '@path': '$.context.campaign.content' }
      }
    },
    location: {
      label: 'Location',
      type: 'object',
      description: 'The geographic location of the user.',
      properties: {
        country: {
          label: 'Country',
          type: 'string',
          description: 'Country of the user.'
        },
        region: {
          label: 'Region/State',
          type: 'string',
          description: 'Region or state of the user.'
        },
        city: {
          label: 'City',
          type: 'string',
          description: 'City of the user.'
        }
      },
      default: {
        country: { '@path': '$.context.location.country' },
        region: { '@path': '$.context.location.region' },
        city: { '@path': '$.context.location.city' }
      }
    },
    properties: {
      label: 'Event Properties',
      type: 'object',
      description: 'Properties associated with the event.',
      required: false,
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.properties' }
    }
  },
  perform: async (request, {payload}) => {
    const {
      event,
      identifiers: {
        userId,
        email
      },
      identifiers: {
        anonymousId
      } = {},
      listId,
      timestamp,
      ip, 
      userAgent, 
      page, 
      campaign,
      location,
      properties
    } = payload

    if(!userId && !email && !anonymousId) {
      throw new PayloadValidationError('At least one identifier (userId, email, or anonymousId) is required.')
    }

    delete properties?.email
    delete properties?.list_id

    const json: TrackEventJSON = {
      event,
      userId,
      ...(anonymousId ? { anonymousId } : {}),
      email,
      listId, 
      timestamp,
      ip,
      userAgent,
      page,
      campaign,
      location,
      properties
    }

    return await request(TRACK_EVENT_URL, {
      method: 'POST',
      json
    })
  
  }
}

export default action
