import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Entered',
  description: '',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    audience_key: {
      label: 'Audience Key',
      description: 'Identifies the user within the target audience.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    identifier_data: {
      label: 'Identifier Data',
      description: `Additional information pertaining to the user.`,
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only'
    },
    delimiter: {
      label: 'Delimeter',
      description: `Character used to separate tokens in the resulting file. 
      This character cannot be contained in any of your data points.`,
      type: 'string',
      required: true,
      default: ','
    },
    audience_name: {
      label: 'Audience name',
      description: `Name of the audience the user has entered.`,
      type: 'string',
      required: true,
      default: { '@path': '$.context.properties.audience_key' }
    }
  },
  perform: (_request, _data) => {
    // validate
    // format
    // upload
  }
}

export default action
