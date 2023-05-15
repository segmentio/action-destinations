import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { manageTags } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Tags',
  description: 'Associate tags with users in your audience to segmentation and automation',
  fields: {
    named_user_id: {
      label: 'Airship Named User ID',
      description: 'The identifier assigned in Airship as the Named User',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    tags: {
      label: 'Tag Name',
      description: 'Tag to add or remove',
      type: 'object',
      default: {
        '@path': '$.traits.airship_tags'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    return manageTags(request, settings, payload)
  }
}

export default action
