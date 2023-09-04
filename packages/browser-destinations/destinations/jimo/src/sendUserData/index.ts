import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { JimoSDK } from 'src/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, JimoSDK, Payload> = {
  title: 'Send User Data',
  description: 'Set Jimo identify data from segment.io data',
  platform: 'web',
  fields: {
    userId: {
      label: 'Internal User Id',
      description: 'The unique user id provided to segment that will be reuse in Jimo',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.userId'
      }
    }
  },
  defaultSubscription: 'type = "identify"',
  perform: (jimo, { payload }) => {
    console.log('in perform')
    if (payload.userId != null) {
      // Supposed to trigger a network request, nothing happens?
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      jimo.push(['set', 'user:id', payload.userId])
      console.debug('user id sent to jimo')
    } else {
      console.debug('user id not sent, null')
    }
  }
}

export default action
