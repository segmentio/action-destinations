import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { acousticAuth, preChecksAndMaint } from '../Utility/TableMaint_Utilities'
import get from 'lodash/get'
import { addUpdateEvents } from '../Utility/EventProcessing'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Receive Track and Identify Events',
  description: 'Provide Segment Track and Identify Event Data to Acoustic Campaign',
  //defaultSubscription: 'context.personas.computation_class" =  "audience" or "context.personas.computation_class" =  "computed trait"',
  //   Does context.personas.computation_class = "computed trait"
  //defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  // defaultSubscription: 'context.personas.computation_key = "audience" or context.personas.computation_key = "trait"',
  //Only accept track or identify with context.personas.computaiton_key = audience or trait -else- throw error to inform

  fields: {
    email: {
      label: 'Email',
      description: 'Email Field',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
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

  perform: async (request, { payload, settings }) => {
    //console.log('In Perform Action --> ')

    // //Use with Curl testing
    // if (Object.entries(payload).length < 1)
    //   throw new IntegrationError(`Empty Payload - Cannot process ->  ${Object.keys(payload)}   <- `)

    let email = get(payload, 'context.traits.email', 'Null')
    if (email == undefined) email = get(payload, 'traits.email', 'Null')
    if (email == undefined || email === 'Null')
      throw new IntegrationError('Email not provided, cannot process Audience Events without included Email')

    const auth: acousticAuth = await preChecksAndMaint(request, settings)

    //Ok, email, prechecks and Maint are all accomplished, let's see what needs to be processed,
    return await addUpdateEvents(request, payload, settings, auth, email)
  },

  performBatch: async (request, { payload, settings }) => {
    console.log('In Perform Batch Action -> ')

    const auth: acousticAuth = await preChecksAndMaint(request, settings)

    //Ok, prechecks and Maint are all attended to, let's see what needs to be processed,
    let i = 0
    for (const e of payload) {
      i++

      let email = get(e, 'context.traits.email', 'Null')
      if (email == undefined) email = get(e, 'traits.email', 'Null')
      if (email == undefined)
        throw new IntegrationError('Email not provided, cannot process Audience Events without included Email')

      return await addUpdateEvents(request, e, settings, auth, email)
    }
    return i
  }
}

export default action
