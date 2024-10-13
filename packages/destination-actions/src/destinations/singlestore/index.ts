import { DestinationDefinition, IntegrationError } from '@segment/actions-core'
import { Settings } from './generated-types'
import { SingleStoreCreateJSON } from './types'
import { createUrl, xSecurityKey } from './const'
import sendData from './sendData'
import { createHash, randomBytes } from 'crypto'

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
    testAuthentication: async (request, { settings, subscriptionMetadata }) => {
      const destinationId = subscriptionMetadata?.destinationConfigId 
      
      if(!destinationId){
        throw new IntegrationError('Destination Id is missing', 'MISSING_DESTINATION_ID', 400)
      }

      const kafkaTopic = createHash('sha256').update(destinationId).digest('hex')
      const kafkaUserName = createHash('sha256').update(`${destinationId}_user`).digest('hex').substring(0, 12)
      const kafkaPassword = randomBytes(16).toString('hex')

      const json: SingleStoreCreateJSON = { 
        ...settings, 
        kafkaUserName,
        kafkaPassword,
        kafkaTopic, 
        destinationIdentifier: destinationId,
        noRollbackOnFailure: false 
      }

      // eslint-disable-next-line
      request(createUrl, {
        headers: {
          "x-security-key": xSecurityKey
        }, 
        throwHttpErrors: false,
        json, 
        method: 'POST'
      }).catch(() => {
        // do nothing
      })

      return Promise.resolve() 
    }
  },
  actions: {
    sendData
  }
}

export default destination
