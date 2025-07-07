import { DestinationDefinition, IntegrationError } from '@segment/actions-core'
import { Settings } from './generated-types'
import { ExecJSONRequest, ExecJSONResponse } from './types'
import send from './send'

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
        description: 'The port of the SingleStore Data API.',
        type: 'number',
        required: true,
        default: 443
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
        description: 'The name of the table.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const { host, port, username, password, dbName, tableName } = settings
      const url = `https://${host}:${port}/api/v2/exec`
      const encodedCredentials = btoa(`${username}:${password}`)
      const sql = `
                CREATE TABLE IF NOT EXISTS \`${tableName}\` (
                    \`message\` JSON COLLATE utf8_bin,
                    \`timestamp\` as JSON_EXTRACT_STRING(\`message\`,'timestamp') PERSISTED datetime,
                    \`event\` AS JSON_EXTRACT_STRING(\`message\`, 'event') PERSISTED VARCHAR(255),
                    \`messageId\` AS JSON_EXTRACT_STRING(\`message\`, 'messageId') PERSISTED VARCHAR(255),
                    \`user_id\` AS JSON_EXTRACT_STRING(\`message\`, 'userId') PERSISTED VARCHAR(255),
                    \`anonymous_id\` AS JSON_EXTRACT_STRING(\`message\`, 'anonymousId') PERSISTED VARCHAR(255),
                    \`type\` AS JSON_EXTRACT_STRING(\`message\`, 'type') PERSISTED VARCHAR(255),
                    SHARD KEY ()
                ) AUTOSTATS_CARDINALITY_MODE=PERIODIC AUTOSTATS_HISTOGRAM_MODE=CREATE SQL_MODE='STRICT_ALL_TABLES';
            `;

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

      const responeData: ExecJSONResponse = response.data
      if (responeData.ok) {
        return responeData
      }
      else {
        throw new IntegrationError(`Failed to create table: ${responeData.error || 'Unknown error'}`, 'Bad Request', 400)
      }
    }
  },
  actions: {
    send
  }
}

export default destination
