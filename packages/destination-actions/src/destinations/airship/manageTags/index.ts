import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { manageTags } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Manage Tags',
  description: 'Associate tags with users in your audience for segmentation and automation',
  fields: {
    named_user_id: {
      label: 'Airship Named User ID',
      description: 'The identifier assigned in Airship as the Named User. Provide either this or Channel ID.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    channel_id: {
      label: 'Channel ID',
      description: 'Airship Channel ID. Provide either this or Named User ID.',
      type: 'string',
      required: false
    },
    channel_type: {
      label: 'Channel Type',
      description:
        'The device type for the Channel ID (e.g. ios, android, amazon, web). Defaults to the device type from the event. If omitted or unrecognized, the generic channel key is used and Airship resolves the type, which may introduce a slight delay.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.device.type'
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
        'The Tag Group to sync your tags to. This defaults to`segment-integration` but can be overridden with this field. Note: the Tag Group used must be valid and exist in Airship.',
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
