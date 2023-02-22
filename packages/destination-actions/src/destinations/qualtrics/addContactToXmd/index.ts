import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import QualtricsApiClient from '../qualtricsApiClient'
import type { Payload } from './generated-types'
import { getDirectoryIds } from '../dynamicFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create and/or update contact in XM Directory',
  description:
    'Create and/or update contact in XM Directory. Updating is handled by contact deduplication in your [directory settings](https://www.qualtrics.com/support/iq-directory/directory-settings-tab/automatic-deduplication/). If deduplication is setup correctly this action will perform UPSERT operations on contacts',
  defaultSubscription: 'type = "identify"',
  fields: {
    directoryId: {
      label: 'Directory ID',
      type: 'string',
      description: 'Directory id. Also known as the Pool ID. POOL_XXX',
      required: true,
      dynamic: true
    },
    extRef: {
      label: 'External Data Reference',
      type: 'string',
      description: 'The external data reference which is a unique identifier for the user',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'Email of contact',
      default: {
        '@if': {
          exists: { '@path': '$.email' },
          then: { '@path': '$.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    phone: {
      label: 'Phone number',
      type: 'string',
      description: 'Phone number of contact',
      default: {
        '@path': '$.traits.phone'
      }
    },
    firstName: {
      label: 'First Name',
      type: 'string',
      description: 'First name of contact',
      default: {
        '@path': '$.traits.firstName'
      }
    },
    lastName: {
      label: 'Last Name',
      type: 'string',
      description: 'Last name of contact',
      default: {
        '@path': '$.traits.lastName'
      }
    },
    language: {
      label: 'Language',
      type: 'string',
      description: 'Language code of the contact',
      default: {
        '@if': {
          exists: { '@path': '$.traits.language' },
          then: { '@path': '$.traits.language' },
          else: 'EN'
        }
      }
    },
    unsubscribed: {
      label: 'Contact is unsubscribed',
      type: 'boolean',
      description: 'Should the contact be unsubscribed from correspondence',
      default: false
    },
    embeddedData: {
      label: 'Contact embedded data',
      type: 'object',
      description: 'Contact embedded data (properties of the contact)',
      defaultObjectUI: 'keyvalue'
    }
  },
  dynamicFields: {
    directoryId: getDirectoryIds
  },
  perform: (request, data) => {
    const apiClient = new QualtricsApiClient(data.settings.datacenter, data.settings.apiToken, request)
    const payload = {
      firstName: data.payload.firstName,
      lastName: data.payload.lastName,
      phone: data.payload.phone,
      email: data.payload.email,
      extRef: data.payload.extRef,
      unsubscribed: data.payload.unsubscribed,
      language: data.payload.language,
      embeddedData: data.payload.embeddedData
    }
    return apiClient.createDirectoryContact(data.payload.directoryId, payload)
  }
}

export default action
