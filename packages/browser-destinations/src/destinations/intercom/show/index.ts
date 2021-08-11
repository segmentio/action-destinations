/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, Intercom_.IntercomStatic, Payload> = {
  title: 'Show',
  description:
    'This will show the Messenger. If there are no new conversations, it will open to the Messenger Home. If there are, it will open with the message list.',
  platform: 'web',
  fields: {},
  perform: (intercom) => {
    return intercom('show')
  }
}

export default action
