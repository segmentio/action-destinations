import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { RequestOptions } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { DevUserListResponse, PartListResponse, devrevApiPaths, devrevApiRoot } from '../utils'
import { APIError } from '@segment/actions-core'

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
      required: true,
      default: { '@path': '$.event' }
    },
    description: {
      label: 'Work Description',
      description: 'The description of the work to create.',
      type: 'text',
      required: true,
      default: { '@path': '$.properties.description' }
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
      format: 'text',
      default: 'p2',
      dynamic: true,
    },
    type: {
      label: 'Type',
      description: 'The type of the work to create.',
      type: 'string',
      required: true,
      format: 'text',
      default: 'issue',
      dynamic: true,
    }
  },
  dynamicFields: {
    type: async (): Promise<DynamicFieldResponse> => {
      return {
        choices: [
          { value: 'issue', label: 'Issue -  Work created by automations' },
          { value: 'ticket', label: 'Ticket - Customer request for assistance' },
        ],
        nextPage: ''
      }
    },
    priority: async (): Promise<DynamicFieldResponse> => {
      return {
        choices: [
          { value: 'p0', label: 'P0 - Critical' },
          { value: 'p1', label: 'P1 - High' },
          { value: 'p2', label: 'P2 - Medium' },
          { value: 'p3', label: 'P3 - Low' },
        ],
        nextPage: ''
      }
    },
    partId: async (request): Promise<DynamicFieldResponse> => {
      try {
        const result: PartListResponse = await request(`${devrevApiRoot}${devrevApiPaths.partsList}`, {
          method: 'get',
          skipResponseCloning: true
        })
        const choices = result.data.parts.map((part) => {
          return { value: part.id, label: part.name }
        })
        return {
          choices,
          nextPage: result.data.next_cursor
        }
      } catch (e) {
        return {
          choices: [],
          nextPage: '',
          error: {
            message: (e as APIError).message ?? 'Unknown error',
            code: (e as APIError).status + '' ?? 'Unknown error'
          }
        }
      }
    },
    assignTo: async (request): Promise<DynamicFieldResponse> => {
      try {
        console.log(`Requesting ${devrevApiRoot}${devrevApiPaths.devUsersList}`)
        const results: DevUserListResponse = await request(
          `${devrevApiRoot}${devrevApiPaths.devUsersList}`,
          {
            method: 'get',
            skipResponseCloning: true
          }
        )
        const choices = results.data.dev_users.map((user) => {
          return { value: user.id, label: `${user.full_name} <${user.email}>` }
        })
        return {
          choices,
          nextPage: results.data.next_cursor
        }
      } catch (e) {
        return {
          choices: [],
          nextPage: '',
          error: {
            message: (e as APIError).message ?? 'Unknown error',
            code: (e as APIError).status + '' ?? 'Unknown error'
          }
        }
      }
    }
  },

  perform: (request, { payload }) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
    const { partId, title, description, assignTo, type, priority } = payload
    const url = `${devrevApiRoot}${devrevApiPaths.worksCreate}`
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
    console.log(`Requesting ${url}`)

    return request(url, options)
  }
}

export default action
