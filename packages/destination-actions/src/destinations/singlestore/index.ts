import { DestinationDefinition, IntegrationError } from '@segment/actions-core'
import { Settings } from './generated-types'
import { ExecJSONRequest, ExecJSONResponse } from './types'
import send from './send'
import btoa from 'btoa-lite'

const destination: DestinationDefinition<Settings> = {
  name: 'SingleStore',
  slug: 'actions-singlestore',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      host: {
        label: 'Host',
        description: 'The host of the SingleStore database.',
        type: 'string',
        required: true
      },
      port: {
        label: 'Port',
        description: 'The port of the SingleStore Data API. Defaults to 443.',
        type: 'string',
        default: '443'
      },
      username: {
        label: 'Username',
        description: 'The username of the SingleStore database.',
        type: 'string',
        required: true
      },
      password: {
        label: 'Password',
        description: 'The password of the SingleStore database.',
        type: 'password',
        required: true
      },
      dbName: {
        label: 'Database Name',
        description: 'The name of the database.',
        type: 'string',
        required: true
      },
      tableName: {
        label: 'Table Name',
        description: 'The name of the table. Defaults to "segment_data".',
        type: 'string',
        required: true,
        default: 'segment_data'
      }
    },
    testAuthentication: async (request, { settings }) => {
      const { host, port, username, password, dbName, tableName } = settings

      const url = `https://${host}:${port}/api/v2/exec`

      const encodedCredentials = btoa(`${username}:${password}`)

      const sql = `
        CREATE TABLE IF NOT EXISTS \`${tableName.replace(/`/g, '``')}\` (
          messageId VARCHAR(255) NOT NULL,
          timestamp DATETIME NOT NULL,
          type VARCHAR(255) NOT NULL,
          event VARCHAR(255),
          name VARCHAR(255),
          properties JSON,
          userId VARCHAR(255),
          anonymousId VARCHAR(255),
          groupId VARCHAR(255),
          traits JSON,
          context JSON,
          SHARD KEY ()
        ) AUTOSTATS_CARDINALITY_MODE=PERIODIC AUTOSTATS_HISTOGRAM_MODE=CREATE SQL_MODE='STRICT_ALL_TABLES';
      `

      const requestData: ExecJSONRequest = {
        sql,
        database: dbName
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

      if (response.status !== 200 || response.ok === false) {
        throw new IntegrationError(
          `Failed to create table: ${(await response.text()) || 'Unknown error'}`,
          response.statusText,
          response.status
        )
      }
      return response
    }
  },
  actions: {
    send
  }
}

export default destination
