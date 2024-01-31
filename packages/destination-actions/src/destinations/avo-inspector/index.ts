/* eslint-disable @typescript-eslint/no-explicit-any */

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import processEventAction from './processEvent'
import { Environment } from './processEvent/avo-types'

// import {processEvent } from './avo'

//import { SegmentEvent } from './avo-types'

const destination: DestinationDefinition<Settings> = {
  name: 'Avo Inspector (Actions)',
  slug: 'actions-avo-inspector',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'Api Key',
        description: 'Avo Inspector API Key',
        type: 'string',
        required: true
      },
      env: {
        label: 'Environment',
        description: 'Avo Inspector Environment',
        type: 'string',
        choices: Object.values(Environment).map((environment) => ({ label: environment, value: environment })),
        default: Environment.PROD,
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      const resp = request(`https://api.avo.app/auth/inspector/validate`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json' // This line is crucial for sending JSON content
        },
        body: JSON.stringify({
          apiKey: settings.apiKey
        })
      })

      return resp
    }
  },

  actions: {
    processEvent: processEventAction // Add your action here
  }
}

export default destination
