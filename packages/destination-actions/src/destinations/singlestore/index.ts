import { DestinationDefinition, IntegrationError, InvalidAuthenticationError } from '@segment/actions-core'
import { Settings } from './generated-types'
import { SingleStoreCreateJSON } from './types'
import { createUrl } from './const'
import send from './send'
// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'
import { encryptText, destinationId, checkChamber } from './util'

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
      port: {
        label: 'Port',
        description: 'The port of the Singlestore database.',
        type: 'number',
        required: true,
        default: 3306
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
      },
      environment: {
        label: 'Environment',
        description: 'The environment of the Singlestore database.',
        type: 'string',
        required: true,
        choices: [
          {
            value: 'Prod',
            label: 'Prod'
          },
          {
            value: 'Stage',
            label: 'Stage'
          }
        ],
        default: 'Prod'
      }
    },
    testAuthentication: async (request, { settings }) => {
      checkChamber()

      const destination_id = destinationId(settings)

      if (!destination_id) {
        throw new IntegrationError('Destination Id is missing', 'MISSING_DESTINATION_ID', 400)
      }
      const kafkaTopic = createHash('sha256').update(destination_id).digest('hex')
      const kafkaUsername = createHash('sha256').update(`${destination_id}_user`).digest('hex')
      const kafkaPassword = encryptText(kafkaUsername)

      const json: SingleStoreCreateJSON = {
        ...settings,
        kafkaUsername,
        kafkaPassword,
        kafkaTopic,
        destinationIdentifier: destination_id,
        noRollbackOnFailure: true
      }
      let res
      try {
        res = await request(createUrl, {
          headers: {
            'x-security-key': process.env.ACTIONS_SINGLE_STORE_X_SECURITY_KEY as string
          },
          throwHttpErrors: false,
          json,
          method: 'POST'
        })
      } catch (err) {
        return Promise.resolve('Configuration is taking a bit longer than normal...')
      }

      if (res?.status != 200) {
        const messageBody = JSON.parse(JSON.stringify(res?.data))
        throw new InvalidAuthenticationError(`${messageBody.error}`)
      }
      return res
    }
  },
  actions: {
    send
  }
}

export default destination
