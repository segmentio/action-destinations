import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'
import { UniversalStorage } from '@segment/analytics-next'
import { storageFallback } from './utils'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Contentstack Browser Plugin',
  description:
    'Enriches all Segment payloads with a value indicating if Attributes need to be created in Contentstack before they are synced.',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {
    traits: {
      type: 'object',
      default: { '@path': '$.traits' },
      label: 'User traits',
      description: 'User Profile traits to send to Contentstack',
      required: true
    }
  },
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics, payload }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const { traits } = payload

    if (traits === undefined || traits === null) {
      return
    }

    const cacheKey = 'traits'
    const cachedDataString: string | null = storage.get(cacheKey)

    console.log(`cachedData = ${cachedDataString} typeof cachedData = ${typeof cachedDataString}`)

    let shoudCreate = false
    let cacheData: object | undefined

    if (cachedDataString) {
      cacheData = JSON.parse(cachedDataString)

      console.log(`cacheData = ${cacheData} typeof cacheData = ${typeof cacheData}`)
      console.log(`cacheData tostring = ${JSON.stringify(cacheData, null, 2)}`)

      const differences = Object.keys(traits).filter((element) => !Object.keys(cacheData ?? {}).includes(element))
      if (differences.length > 0) {
        shoudCreate = true
      }
    } else {
      shoudCreate = true
    }

    console.log(`shoudCreate = ${shoudCreate}`)

    if (context.event.integrations?.All !== false || context.event.integrations['Contentstack']) {
      context.updateEvent('integrations.Contentstack', {})
      context.updateEvent(`integrations.Contentstack.createAttributes`, shoudCreate)
    }

    storage.set(cacheKey, JSON.stringify({ ...cacheData, ...traits }))

    console.log(`updatedCacheData = ${storage.get(cacheKey)}`)

    return
  }
}

export default action
