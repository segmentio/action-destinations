import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { initialize } from './initialize'
import show from './show'

export const destination: BrowserDestinationDefinition<Settings, Intercom_.IntercomStatic> = {
  name: 'Intercom',
  mode: 'device',
  settings: {
    app_id: {
      label: 'Workspace ID',
      type: 'string',
      required: true,
      description:
        'Your workspace ID (this appears as app _id in your code) is a unique code assigned to your app when you create it in Intercom. https://www.intercom.com/help/en/articles/3539-where-can-i-find-my-workspace-id-app-id'
    }
  },
  actions: {
    show
  },
  initialize
}

export default browserDestination(destination)
