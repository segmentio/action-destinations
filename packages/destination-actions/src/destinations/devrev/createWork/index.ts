import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DynamicFieldResponse } from '@segment/actions-core'
import { RequestOptions } from '@segment/actions-core'
import { baseUrl } from '../shared'
import { DynamicFieldItem } from '../../../../../core/dist/cjs/destination-kit/types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Work',
  description: 'Creates a new work item',
  defaultSubscription: 'type = "track"',
  fields: {
    partId: {
      label: 'Part ID',
      description: 'The ID of the part to create work for.',
      type: 'string',
      required: true,
      dynamic: true
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
      type: 'text',
      required: true
    },
    assignTo: {
      label: 'Assign to',
      description: 'The user ID of the user to assign the work to.',
      type: 'string',
      required: true,
      dynamic: true
    },
    priority: {
      label: 'Priority',
      description: 'The priority of the work to create.',
      type: 'string',
      required: true,
      format: 'regex',
      default: 'p2'
    },
    type: {
      label: 'Type',
      description: 'The type of the work to create.',
      type: 'string',
      required: true,
      format: 'regex',
      default: 'issue'
    }
  },
  dynamicFields: {
    partId: async (): Promise<DynamicFieldResponse> => {
      const url = `${baseUrl}/v1/parts`
      const options = {
        method: 'GET'
      }
      const response = await fetch(url, options)
      const parts = await response.json()
      const choices: DynamicFieldItem[] = []

      parts.foreach((part: any) => {
        choices.push({
          label: part.name,
          value: part.id
        })
      })
      return { choices, nextPage: par }
    },
    assignTo: async (): Promise<DynamicFieldResponse> => {
      return { choices: [] }
    }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
    const { partId, title, description, assignTo, type, priority } = payload
    const url = 'https://api.devrev.ai/v1/work'
    const options: RequestOptions = {
      method: 'POST',
      json: {
        applies_to_part: partId,
        title,
        body: description,
        owned_by: [assignTo],
        type,
        priority
      }
    }
    console.log(`URL: ${url} Options:`)
    console.log(options)
    return request(url, options)
  }
}

export default action
