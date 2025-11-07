import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UPSERT_CONTACT_URL } from './constants'
import { UpsertContactJSON } from './types'
import { formatDate } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Sync Segment user profile details to Yonoma Contacts.',
  defaultSubscription: 'type = "identify"',
  fields: {
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
        email: { '@path': '$.traits.email' }
      }
    },
    listId: {
      label: 'List ID',
      type: 'string',
      description: 'The Yonoma list to add the contact to.',
      required: true,
      default: { '@path': '$.traits.list_id' }
    },
    status: {
      label: 'Email subscription status',
      type: 'boolean',
      description:
        'Indicates if the Contact is subscribed or unsubscribed from marketing emails. Set to true to subscribe, false to unsubscribe.',
      required: true,
      default: true
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
      label: 'Contact Properties',
      type: 'object',
      description: 'Additional Contact metadata.',
      required: false,
      additionalProperties: false,
      defaultObjectUI: 'keyvalue',
      properties: {
        firstName: {
          label: 'First Name',
          type: 'string',
          description: "Contact's first name."
        },
        lastName: {
          label: 'Last Name',
          type: 'string',
          description: "Contact's last name."
        },
        phone: {
          label: 'Phone Number',
          type: 'string',
          description: "Contact's phone number."
        },
        dateOfBirth: {
          label: 'Date of Birth',
          type: 'string',
          description: "Contact's date of birth in YYYY-MM-DD or ISO8601 format."
        },
        address: {
          label: 'Address',
          type: 'string',
          description: "Contact's address."
        },
        city: {
          label: 'City',
          type: 'string',
          description: "Contact's city."
        },
        state: {
          label: 'State',
          type: 'string',
          description: "Contact's state or province."
        },
        country: {
          label: 'Country',
          type: 'string',
          description: "Contact's country."
        },
        zipcode: {
          label: 'Zip Code',
          type: 'string',
          description: "Contact's postal code."
        }
      },
      default: {
        firstName: { '@path': '$.traits.first_name' },
        lastName: { '@path': '$.traits.last_name' },
        phone: { '@path': '$.traits.phone' },
        dateOfBirth: { '@path': '$.traits.birthday' },
        address: { '@path': '$.traits.address.street' },
        city: { '@path': '$.traits.address.city' },
        state: { '@path': '$.traits.address.state' },
        country: { '@path': '$.traits.address.country' },
        zipcode: { '@path': '$.traits.address.postal_code' }
      }
    },
    tags_to_add: {
      label: 'Tags to Add',
      type: 'string',
      multiple: true,
      description:
        'List of tags to add to the Contact. Can be a single string or array of tags. Tags must already exist in Yonoma.',
      required: false,
      default: { '@path': '$.traits.tags_to_add' }
    },
    tags_to_remove: {
      label: 'Tags to Remove',
      type: 'string',
      multiple: true,
      description:
        'List of tags to remove from the Contact. Can be a single string or array of strings. Tags must already exist in Yonoma.',
      required: false,
      default: { '@path': '$.traits.tags_to_remove' }
    }
  },
  perform: async (request, { payload }) => {
    const {
      identifiers: { userId, email },
      identifiers: { anonymousId } = {},
      listId,
      status,
      ip,
      timestamp,
      userAgent,
      page,
      campaign,
      location,
      properties: { firstName, lastName, phone, dateOfBirth, address, city, state, country, zipcode } = {},
      tags_to_add,
      tags_to_remove
    } = payload

    if (!userId && !email && !anonymousId) {
      throw new PayloadValidationError('At least one identifier (userId, email, or anonymousId) is required.')
    }

    const jsonUpsertContact: UpsertContactJSON = {
      userId,
      ...(anonymousId ? { anonymousId } : {}),
      email,
      listId,
      status,
      timestamp,
      ip,
      userAgent,
      page,
      campaign,
      location,
      properties: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(phone ? { phone } : {}),
        ...(dateOfBirth ? { dateOfBirth: formatDate(dateOfBirth) } : {}),
        ...(address ? { address } : {}),
        ...(city ? { city } : {}),
        ...(state ? { state } : {}),
        ...(country ? { country } : {}),
        ...(zipcode ? { zipcode } : {}),
        ...(typeof tags_to_add === 'string' || (Array.isArray(tags_to_add) && tags_to_add.length > 0)
          ? { tags_to_add: Array.isArray(tags_to_add) ? tags_to_add : [tags_to_add] }
          : {}),
        ...(typeof tags_to_remove === 'string' || (Array.isArray(tags_to_remove) && tags_to_remove.length > 0)
          ? { tags_to_remove: Array.isArray(tags_to_remove) ? tags_to_remove : [tags_to_remove] }
          : {})
      }
    }

    await request(UPSERT_CONTACT_URL, {
      method: 'POST',
      json: jsonUpsertContact
    })
  }
}

export default action
