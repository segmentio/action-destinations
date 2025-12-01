import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { TrackPageEventJSON } from './types'
import { TRACK_PAGE_VIEW_URL } from './constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Page View',
  description: 'Log page visits to build behavioral profiles and trigger view-based automations in Yonoma.',
  defaultSubscription: 'type = "page"',
  fields: {
    identifiers: {
      label: 'Identifiers',
      type: 'object',
      description: 'Unique identifiers for the contact.',
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
          description: "Contact's email address."
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
      label: 'Additional Page Properties',
      type: 'object',
      description: 'Additional properties associated with the event.',
      defaultObjectUI: 'keyvalue'
    }
  },
  perform: async (request, {payload}) => {
    const {
      identifiers: {
        userId,
        email,
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

    delete properties?.email
    delete properties?.list_id

    const json: TrackPageEventJSON = {
      ...(userId ? { userId } : {}),
      ...(anonymousId ? { anonymousId } : {}),
      ...(email ? { email } : {}),
      listId,
      timestamp,
      ip,
      userAgent,
      page,
      campaign,
      location,
      properties
    }

    return await request(TRACK_PAGE_VIEW_URL, {
      method: 'POST',
      json
    })
  }
}

export default action
