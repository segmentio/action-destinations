import { DestinationDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'
import { CreateTableJSONRequest, CreateTableJSONResponse } from './types'
import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Singlestore',
  slug: 'actions-singlestore',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      host: {
        label: 'Host',
        description: 'The host of the Singlestore database.',
        type: 'string',
        required: true
      },
      username: {
        label: 'Username',
        description: 'The username of the Singlestore database.',
        type: 'string',
        required: true
      },
      password: {
        label: 'Password',
        description: 'The password of the Singlestore database.',
        type: 'password',
        required: true
      },
      dbName: {
        label: 'Database Name',
        description: 'The name of the database.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const { host, username, password, dbName } = settings
      const url = `https://${host}/api/v2/exec`
      const encodedCredentials = btoa(`${username}:${password}`)
      const sql = `CREATE TABLE IF NOT EXISTS segment_data(received TIMESTAMP(6), data JSON)`

      const response = await request<CreateTableJSONRequest>(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedCredentials}`
        },
        json: {
          sql,    
          database: dbName
        },
        throwHttpErrors: false
      })
      const responeData: CreateTableJSONResponse = response.data

      if (response.ok) {
        return response 
      }
      else {
        throw new IntegrationError(`Failed to create table: ${responeData.error || 'Unknown error'}`)
      }

    }
 
  },
  actions: {
    send
  }
}

export default destination
