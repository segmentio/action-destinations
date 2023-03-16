import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { preChecksAndMaint } from '../Utility/tablemaintutilities'
import get from 'lodash/get'
import { addUpdateEvents, postUpdates } from '../Utility/event_processing'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Receive Track and Identify Events',
  description: 'Provide Segment Track and Identify Event Data to Acoustic Campaign',
  fields: {
    email: {
      label: 'Email',
      description: 'At a minimum Email is required, see mapping presets for more info.',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@path': '$.email'
      }
    },
    type: {
      label: 'Type',
      description: 'The Event Type, will be either Track or Identify',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The Timestamp of the Event',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    context: {
      label: 'Context',
      description: 'Parses all properties provided via a Context Section ',
      type: 'object',
      default: {
        '@path': '$.context'
      }
    },
    properties: {
      label: 'Properties',
      description: 'Parses all properties provided via a Properties Section',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    traits: {
      label: 'Traits',
      description: 'Parses all properties provided via a Traits Section',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    const email = get(payload, 'email', 'Null')

    await preChecksAndMaint(request, settings)

    //Ok, prechecks and Maint are all accomplished, let's see what needs to be processed,
    const rows = addUpdateEvents(payload, email)
    return await postUpdates(request, settings, rows, 1)
  }
}

export default action
