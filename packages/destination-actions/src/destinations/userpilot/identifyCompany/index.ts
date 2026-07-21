import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { getCompanyIdentifyRequestParams } from '../request-utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Company',
  description:
    'Defines a company in Userpilot, you can visit [Userpilot docs](https://docs.userpilot.com/article/23-identify-users-track-custom-events) for more information.',
  defaultSubscription: 'type = "group"',
  fields: {
    groupId: {
      type: 'string',
      required: true,
      description: 'The ID of the company.',
      label: 'Company ID',
      default: {
        '@path': '$.groupId'
      }
    },
    createdAt: {
      type: 'datetime',
      required: false,
      description: 'The date the company profile was created at',
      label: 'Company Created At Date',
      default: {
        '@path': '$.traits.createdAt'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'Segment traits',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const { traits, groupId, createdAt } = payload

    traits?.createdAt && delete traits.createdAt

    const { url, options } = getCompanyIdentifyRequestParams(settings, {
      traits: { ...traits, created_at: createdAt || traits?.created_at },
      groupId
    })

    return request(url, options)
  }
}

export default action
