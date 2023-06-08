import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createWorkParams } from '../request-params'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Work',
  description: 'Creates a new work item',
  defaultSubscription: 'type = "track"',
  fields: {
    partId: {
      label: 'Part ID',
      description: 'The ID of the part to create work for.',
      type: 'string',
      required: true
    },
    title: {
      label: 'Work Title',
      description: 'The title of the work to create.',
      type: 'string',
      required: true
    },
    description: {
      label: 'Work Description',
      description: 'The description of the work to create.',
      type: 'string',
      required: true
    },
    assignTo: {
      label: 'Assign to',
      description: 'The user ID of the user to assign the work to.',
      type: 'string',
      required: true
    }
  },
  perform: (request, { payload, settings }) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
    const { partId, title, description, assignTo } = payload
    const { url, options } = createWorkParams(settings, partId, title, description, assignTo)
    console.log(`URL: ${url} Options:`)
    console.log(options)
    return request(url, options)
  }
}

export default action
