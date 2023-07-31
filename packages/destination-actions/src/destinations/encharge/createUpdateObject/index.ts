import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enchargeIngestAPIURL } from '../utils'
import { getCustomObjects } from './getCustomObjects'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Object',
  description:
    'Create or Update a Custom Object (including Companies) in Encharge. If email or user ID are provided, the user will be associated with the object. A new user will be created if the email or user ID do not exist in Encharge.',
  defaultSubscription: 'type = "group"',
  fields: {
    objectType: {
      label: 'Object Type',
      description: 'The type of Encharge object to create or update.',
      type: 'string',
      required: true,
      dynamic: true,
      default: 'company'
    },
    externalId: {
      type: 'string',
      required: false,
      label: 'External Object ID',
      description: 'An ID from your app/database that is used to uniquely identify the object in Encharge.',
      default: { '@path': '$.groupId' }
    },
    id: {
      type: 'string',
      required: false,
      description: 'The Encharge ID of the object. Usually, you want to omit this and use External ID.',
      label: 'Object ID'
    },
    objectData: {
      type: 'object',
      label: 'Object Fields',
      description:
        'Data for the Object fields to associate with the user in Encharge. Any unexisting fields will be ignored.',
      required: false,
      default: { '@path': '$.traits' }
    },
    userId: {
      type: 'string',
      description:
        'The User ID of the user to associate with the object. If no email or user ID is provided, no user will be created and associated.',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    email: {
      type: 'string',
      description:
        'The email of the user to associate with the object. If no email or user ID is provided, no user will be created and associated.',
      label: 'Email',
      default: { '@path': '$.email' }
    }
  },
  dynamicFields: {
    objectType: getCustomObjects
  },
  perform: (request, data) => {
    const payload = {
      type: 'group',
      objectType: data.payload.objectType,
      properties: {
        ...(data.payload.objectData || {}),
        externalId: data.payload.externalId,
        id: data.payload.id
      },
      user: {
        email: data.payload.email,
        userId: data.payload.userId
      }
    }
    return request(enchargeIngestAPIURL, {
      method: 'post',
      json: payload
    })
  }
}

export default action
