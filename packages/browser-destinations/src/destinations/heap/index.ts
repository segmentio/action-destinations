import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

import page from './page'
import { Heap } from './types'

declare global {
  interface Window {
    heap?: Heap
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Heap',
  slug: 'heap',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
    appId: {
      label: 'Heap app ID',
      description: 'The app ID of the environment to which you want to send data. You can find this ID on the [Projects](https://heapanalytics.com/app/manage/projects) page.',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    const { appId } = settings;

    await deps.loadScript(`<script src="//cdn.heapanalytics.com/js/heap-${appId}.js">`)

  },

  actions: {
    page
  }
}

export default browserDestination(destination)
