import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { preChecksAndMaint } from '../Utility/TableMaint_Utilities'
import get from 'lodash/get'
import { addUpdateEvents, postUpdates } from '../Utility/EventProcessing'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Receive Track and Identify Events',
  description: 'Provide Segment Track and Identify Event Data to Acoustic Campaign',
  fields: {
    email: {
      label: 'Email',
      description: 'Email Field',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    type: {
      label: 'Type',
      description: 'Event Type',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Timestamp',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    context: {
      label: 'Context',
      description: 'Context Section',
      type: 'object',
      default: {
        '@path': '$.context'
      }
    },
    properties: {
      label: 'Properties',
      description: 'Properties Section',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    traits: {
      label: 'Traits',
      description: 'Traits Section',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },

    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of Segment Events through to Acoustic Tables',
      type: 'boolean',
      default: true
    }
  },

  perform: async (request, { settings, payload }) => {
    let email = get(payload, 'context.traits.email', 'Null')
    if (email == undefined || email === 'Null') email = get(payload, 'traits.email', 'Null')
    if (email == undefined || email === 'Null')
      throw new IntegrationError('Email not provided, cannot process Events without included Email')

    const at = await preChecksAndMaint(request, settings)

    //Ok, prechecks and Maint are all accomplished, let's see what needs to be processed,
    const rows = addUpdateEvents(payload, email)

    return await postUpdates(request, settings, at, rows, 1)
  },

  performBatch: async (request, { settings, payload }) => {
    const at = await preChecksAndMaint(request, settings)

    //Ok, prechecks and Maint are all attended to, let's see what needs to be processed,
    let i = 0
    let rows = ''
    for (const e of payload) {
      i++
      let email = get(e, 'context.traits.email', 'Null')
      if (email == undefined) email = get(e, 'traits.email', 'Null')
      if (email == undefined)
        throw new IntegrationError('Email not provided, cannot process Events without included Email')

      rows = addUpdateEvents(e, email)
    }
    return await postUpdates(request, settings, at, rows, i)
  }
}

export default action
