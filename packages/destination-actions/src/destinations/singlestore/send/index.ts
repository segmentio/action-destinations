import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ExecJSONRequest, ExecJSONResponse } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Data',
  description: 'Send data to SingleStore.',
  defaultSubscription:
    'type = "track" or type = "screen" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {
    message: {
      label: 'Message',
      description: 'The complete event payload.',
      type: 'object',
      required: true,
      default: {
        '@path': '$.'
      }
    },
    max_batch_size: {
      label: 'Max Batch Size',
      description: 'The maximum number of rows to include in a batch.',
      type: 'number',
      required: true,
      default: 100
    }
  },

  performBatch: async (request, { payload, settings }) => {
    const { host, port, username, password, dbName, tableName } = settings
    const url = `https://${host}:${port}/api/v2/exec`
    const encodedCredentials = btoa(`${username}:${password}`)

    const sqlValuesClause = Array(payload.length).fill('(?)').join(', ');
    const sql = `INSERT INTO ${tableName} VALUES ${sqlValuesClause}`

    const requestData: ExecJSONRequest = {
      sql,
      database: dbName,
      args: payload.map(item => item.message)
    }

    const response = await request<ExecJSONResponse>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${encodedCredentials}`
      },
      json: requestData,
      throwHttpErrors: false
    })

    const responeData: ExecJSONResponse = response.data
    if (responeData.ok) {
      return responeData
    }
    else {
      throw new IntegrationError(`Failed to insert data: ${responeData.error || 'Unknown error'}`, 'Bad Request', 400)
    }
  },

  perform: async (request, { payload, settings }) => {
    return await action.performBatch?.(request, { payload: [payload], settings })
  },
}

export default action
