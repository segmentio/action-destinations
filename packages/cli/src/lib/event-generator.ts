import { Condition, GroupConditionOperator, Operator } from '@segment/destination-subscriptions'

type SegmentEvent = Record<string, any>

const ajsContext = {
  ip: '8.8.8.8',
  library: {
    name: 'analytics.js',
    version: '3.12.1'
  },
  page: {
    path: '/docs/connections/spec/common/',
    referrer: 'https://google.com',
    search: '?query=segment',
    title: 'Common Specs',
    url: 'https://segment.com/docs/connections/spec/common/'
  },
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
}

const mobileContext = {
  device: {
    id: 'd4a11111-e89b-12d3-a456-426614174000',
    manufacturer: 'Apple',
    model: 'iPhone12,3',
    name: "Segment's iPhone",
    type: 'ios'
  },
  library: {
    name: 'analytics-ios',
    version: '4.1.2'
  },
  locale: 'en-US',
  network: {
    carrier: 'Verizon',
    wifi: true
  },
  os: {
    name: 'iOS',
    version: '14.4'
  },
  timezone: 'America/Los_Angeles',
  ip: '8.8.8.8'
}

const serverContext = {
  library: {
    name: 'analytics-node',
    version: '2.2.1'
  },
  ip: '8.8.4.4',
  locale: 'en-US',
  userAgent: 'node.js/v14.16.0'
}

const personasContext = {
  library: {
    name: 'unknown',
    version: 'unknown'
  },
  personas: {
    computation_class: 'audience', // TODO: use real values
    computation_id: 'aud_unknown',
    computation_key: 'sample_computation_key', // TODO: use real values
    namespace: 'sample_namespace', // TODO: use real values
    space_id: 'sample_space_id' // TODO: use real values
  },
  traits: {} // TODO: Include trait enrichment
}

const baseEvent: SegmentEvent = {
  properties: {},
  traits: {},
  context: {},
  messageId: '022bb90c-bbac-11e4-8dfc-aa07a5b093db',
  receivedAt: '2023-12-10T04:08:31.909Z',
  sentAt: '2023-12-10T04:08:31.581Z',
  timestamp: '2023-12-10T04:08:31.905Z',
  anonymousId: '507f191e810c19729de860ea'
}

const sourceTypeToContext: Record<string, any> = {
  javascript: ajsContext,
  project: ajsContext,
  'personas-compute': personasContext,
  ios: mobileContext,
  android: mobileContext,
  'react-native': mobileContext,
  swift: mobileContext,
  'kotlin-android': mobileContext,
  'node.js': serverContext,
  'http-api': serverContext,
  python: serverContext,
  ruby: serverContext,
  php: serverContext,
  net: serverContext,
  java: serverContext,
  go: serverContext,
  'shopify-littledata': serverContext,
  stripe: serverContext
}

export const getBaseEventForSource = (sourceType: string): SegmentEvent => {
  return {
    ...baseEvent,
    context: {
      ...baseEvent.context,
      ...sourceTypeToContext[sourceType]
    }
  }
}

function isGroupConditionOperator(op: any): op is GroupConditionOperator {
  return ['and', 'or'].includes(op)
}

function setNestedProperty(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!current[key]) {
      current[key] = {}
    }
    current = current[key]
  }
  current[keys[keys.length - 1]] = value
}

function handleOperator(operator: Operator, value: unknown): unknown {
  switch (operator) {
    case '=':
      return value
    case '!=':
      if (value === null || value === undefined) {
        return `not ${value}`
      } else if (typeof value === 'string') {
        return `not ${value}`
      } else if (typeof value === 'number') {
        return value + 1
      } else if (typeof value === 'boolean') {
        return !value
      } else {
        return `not ${value}`
      }
    case '<':
      if (typeof value === 'number') {
        return value - 1
      } else {
        return value
      }
    case '>':
      if (typeof value === 'number') {
        return value + 1
      } else {
        return value
      }
    case '<=':
    case '>=':
      return value
    case 'contains':
    case 'ends_with':
    case 'starts_with':
      return value
    case 'not_contains':
      if (typeof value === 'string') {
        return `not contains ...`
      } else {
        return value
      }
    case 'not_starts_with':
      if (typeof value === 'string') {
        return `not starts with ${value}`
      } else {
        return value
      }
    case 'not_ends_with':
      if (typeof value === 'string') {
        return `${value} ...`
      } else {
        return value
      }
    case 'exists':
      return 'value'
    case 'not_exists':
      return undefined
    case 'is_true':
      return true
    case 'is_false':
      return false
    default:
      throw new Error(`Unsupported operator: ${operator}`)
  }
}

export function reconstructSegmentEvent(conditions: Condition[], baseEvent: SegmentEvent): SegmentEvent {
  const event = { ...baseEvent }

  conditions.forEach((condition) => {
    if (isGroupConditionOperator(condition.operator)) {
      return
    }

    const value = handleOperator(condition.operator, (condition as any).value)
    if (value === undefined) return

    switch (condition.type) {
      case 'event-type':
        event.type = value as string
        break
      case 'event':
        event.event = value as string
        event.type = 'track' // event usually comes with track events
        break
      case 'name':
        event.name = value as string
        event.type = event.type ?? 'page' // name usually comes with page events
        break
      case 'userId':
        event.userId = value as string
        break
      case 'event-property':
        if (!event.properties) {
          event.properties = {}
        }

        if (condition.name) {
          setNestedProperty(event?.properties, condition.name, value)
        }
        event.type = event.type ?? 'track' // properties usually come with track events
        break
      case 'event-trait':
        if (!event.traits) {
          event.traits = {}
        }

        if (condition.name) {
          setNestedProperty(event?.traits, condition.name, value)
        }
        event.type = event.type ?? 'identify' // traits usually come with identify events
        break
      case 'event-context':
        if (condition.name) {
          setNestedProperty(event.context, condition.name, value)
        }
        break
      default:
        break
    }
  })

  const getEventWithoutExtraKey = (): SegmentEvent => {
    if (event.type === 'track') {
      const { traits, ...eventWithoutTraits } = event

      return eventWithoutTraits
    }

    if (event.type === 'identify') {
      const { properties, ...eventWithoutProperties } = event

      return eventWithoutProperties
    }

    return event
  }

  return getEventWithoutExtraKey()
}
