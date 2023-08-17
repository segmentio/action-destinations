import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HeapApi } from '../types'
import { HEAP_SEGMENT_BROWSER_LIBRARY_NAME } from '../constants'
import { isDefined, flat, flattenProperties } from '../utils'

const action: BrowserActionDefinition<Settings, HeapApi, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'A JSON object containing additional information about the event that will be indexed by Heap.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    identity: {
      type: 'string',
      required: false,
      label: 'Identity',
      description:
        'a string that uniquely identifies a user, such as an email, handle, or username. This means no two users in one environment may share the same identity. More on identify: https://developers.heap.io/docs/using-identify'
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'The segment anonymous identifier for the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      description:
        'An object with key-value properties you want associated with the user. Each property must either be a number or string with fewer than 1024 characters.',
      default: {
        '@path': '$.context.traits'
      }
    }
  },
  perform: (heap, event) => {
    // Add user properties
    if (event.payload.anonymousId || isDefined(event.payload?.traits)) {
      const traits = flat(event.payload?.traits)
      heap.addUserProperties({
        ...(isDefined(event.payload.anonymousId) && { anonymous_id: event.payload.anonymousId }),
        ...(isDefined(traits) && traits)
      })
    }

    // Identify user
    if (event.payload?.identity && isDefined(event.payload?.identity)) {
      heap.identify(event.payload.identity)
    }

    // Track Events
    let eventProperties = Object.assign({}, event.payload.properties)
    const eventName = event.payload.name
    const browserArrayLimit = event.settings.browserArrayLimit || 0
    const browserArrayLimitSet = !!browserArrayLimit

    if (browserArrayLimitSet) {
      eventProperties = heapTrackArrays(heap, eventName, eventProperties, browserArrayLimit)
    }

    heapTrack(heap, eventName, eventProperties)
  }
}

const heapTrackArrays = (
  heap: HeapApi,
  eventName: string,
  properties: {
    [k: string]: unknown
  },
  browserArrayLimit: number
) => {
  let eventProperties = Object.assign({}, properties)
  let arrayEventsCount = 0
  for (const [key, value] of Object.entries(eventProperties)) {
    if (arrayEventsCount >= browserArrayLimit) {
      return eventProperties
    }

    if (!Array.isArray(value)) {
      continue
    }

    delete eventProperties[key]
    eventProperties = { ...eventProperties, ...flat({ [key]: value }) }

    const arrayLength = value.length
    let arrayPropertyValues
    // truncate in case there are multiple array properties
    if (arrayLength + arrayEventsCount > browserArrayLimit) {
      arrayPropertyValues = value.splice(0, browserArrayLimit - arrayEventsCount)
    } else {
      arrayPropertyValues = value
    }

    arrayEventsCount += arrayLength

    arrayPropertyValues.forEach((arrayPropertyValue) => {
      const arrayProperties = flattenProperties(arrayPropertyValue)
      heapTrack(heap, `${eventName} ${key} item`, arrayProperties)
    })
  }
  return eventProperties
}

const heapTrack = (
  heap: HeapApi,
  eventName: string,
  properties: {
    [k: string]: unknown
  }
) => {
  properties.segment_library = HEAP_SEGMENT_BROWSER_LIBRARY_NAME
  heap.track(eventName, properties)
}

export default action
