import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { manageTags } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Tags',
  description: 'Associate tags with users in your audience for segmentation and automation',
  fields: {
    named_user_id: {
      label: 'Airship Named User ID',
      description: 'The identifier assigned in Airship as the Named User',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    tags: {
      label: 'Tag Name',
      description:
        'Tag name to add or remove. Values for each tag should be boolean only. A true value creates a tag, a false value removes a tag. Non-boolean values will be ignored.',
      type: 'object',
      default: {
        '@path': '$.traits.airship_tags'
      }
    },
    tag_group: {
      label: 'Tag Group',
      description:
        'The Tag Group to sync your tags to. Normally, this should be `segment-integration`, but set it here if it should be something else. Note: the Tag Group used must be valid and exist in Airship.',
      type: 'string',
      required: true,
      default: 'segment-integration'
    }
  },
  perform: (request, { settings, payload }) => {
    return manageTags(request, settings, payload)
  }
}

export default action
