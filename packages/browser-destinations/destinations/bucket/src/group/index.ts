import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Bucket } from '../types'

const action: BrowserActionDefinition<Settings, Bucket, Payload> = {
  title: 'Identify Company',
  lifecycleHook: 'destination',
  description: 'Creates or updates a Company in Bucket and associates the user with it',
  platform: 'web',
  defaultSubscription: 'type = "group" and userId != null',
  fields: {
    groupId: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the company',
      label: 'Company ID',
      default: {
        '@path': '$.groupId'
      }
    },
    userId: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the user',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'Additional information to associate with the Company in Bucket',
      label: 'Company Attributes',
      default: {
        '@path': '$.traits'
      },
      additionalProperties: true,
      properties: {
        name: {
          type: 'string',
          required: false,
          label: 'Name',
          description: 'The company name',
          default: {
            '@path': '$.traits.name'
          }
        }
      }
    }
  },
  perform: (bucket, { payload }) => {
    // Ensure we never call Bucket.company() without a user ID
    if (payload.userId) {
      void bucket.company(payload.groupId, payload.traits, payload.userId)
    }
  }
}

export default action
