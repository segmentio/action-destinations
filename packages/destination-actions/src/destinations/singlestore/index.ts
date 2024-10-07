import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { createUrl, xSecurityKey } from './const'
import { SingleStoreCreateJSON } from './types'
import {generateKafkaCredentials} from './utils'

import sendData from './sendData'

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
      }
    },
    testAuthentication: async (request, { settings, auth }) => {
     

      const json = { 
        ...settings, 
        
        ...generateKafkaCredentials(settings, destinationId)
      }
    
      const response = request<SingleStoreCreateJSON>(createUrl, {
        headers: {
          "x-security-key": xSecurityKey
        }, 
        throwHttpErrors: false,
        json, 
        method: 'POST'
      })

      return Promise.resolve() 
    }
  },

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    sendData
  }
}

export default destination
