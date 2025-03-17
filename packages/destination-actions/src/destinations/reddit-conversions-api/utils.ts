import type { Features, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload as StandardEvent } from './standardEvent/generated-types'
import type { Payload as CustomEvent } from './customEvent/generated-types'
import {
  StandardEventPayloadItem,
  StandardEventPayload,
  User,
  Product,
  EventMetadata,
  DatapProcessingOptions
} from './types'
import { processHashing } from '../../lib/hashing-utils'

type EventMetadataType = StandardEvent['event_metadata'] | CustomEvent['event_metadata']
type ProductsType = StandardEvent['products'] | CustomEvent['products']
type ConversionIdType = StandardEvent['conversion_id'] | CustomEvent['conversion_id']
type DataProcessingOptionsType = StandardEvent['data_processing_options'] | CustomEvent['data_processing_options']
type UserType = StandardEvent['user'] | CustomEvent['user']
type ScreenDimensionsType = StandardEvent['screen_dimensions'] | CustomEvent['screen_dimensions']

export async function send(
  request: RequestClient,
  settings: Settings,
  payload: StandardEvent[] | CustomEvent[],
  features?: Features
) {
  const data = createRedditPayload(payload, settings, features)
  return request(`https://ads-api.reddit.com/api/v2.0/conversions/events/${settings.ad_account_id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.conversion_token}` },
    json: JSON.parse(JSON.stringify(data))
  })
}

function createRedditPayload(
  payloads: StandardEvent[] | CustomEvent[],
  settings: Settings,
  features?: Features
): StandardEventPayload {
  const payloadItems: StandardEventPayloadItem[] = []

  payloads.forEach((payload) => {
    const {
      event_at,
      click_id,
      products,
      user,
      data_processing_options,
      screen_dimensions,
      event_metadata,
      conversion_id
    } = payload

    const custom_event_name = (payload as CustomEvent).custom_event_name
    const tracking_type = (payload as StandardEvent).tracking_type

    const payloadItem: StandardEventPayloadItem = {
      event_at: event_at as string,
      event_type: {
        // if custom_event_name is present, tracking_type is 'Custom'
        // if custom_event_name not present then we know the event is a StandardEvent
        tracking_type: custom_event_name ? 'Custom' : tracking_type,
        custom_event_name: clean(custom_event_name)
      },
      click_id: clean(click_id),
      event_metadata: getMetadata(event_metadata, products, conversion_id, features),
      user: getUser(user, data_processing_options, screen_dimensions, features)
    }

    payloadItems.push(payloadItem)
  })

  return {
    events: payloadItems,
    test_mode: settings.test_mode,
    partner: 'SEGMENT'
  }
}

function clean(str: string | undefined): string | undefined {
  if (str === undefined || str === null || str === '') return undefined
  return str.trim()
}

function cleanNum(num: number | undefined): number | undefined {
  if (num === undefined || num === null) return undefined
  return num
}

function getProducts(products: ProductsType): Product[] | undefined {
  if (!products) {
    return undefined
  }

  return products.map((product) => {
    return {
      category: clean(product.category),
      id: clean(product.id),
      name: clean(product.name)
    }
  })
}

function getMetadata(
  metadata: EventMetadataType,
  products: ProductsType,
  conversion_id: ConversionIdType,
  features?: Features
): EventMetadata | undefined {
  if (!metadata && !products && !conversion_id) {
    return undefined
  }

  return {
    currency: clean(metadata?.currency),
    item_count: cleanNum(metadata?.item_count),
    value_decimal: cleanNum(metadata?.value_decimal),
    products: getProducts(products),
    conversion_id: processHashing(
      conversion_id ?? '',
      'sha256',
      'hex',
      features,
      'actions-reddit-conversions-api',
      (value) => value.trim()
    )
  }
}

function getAdId(
  device_type?: string,
  advertising_id?: string,
  features?: Features
): { [key: string]: string | undefined } | undefined {
  if (!device_type) return undefined
  if (!advertising_id) return undefined
  const hashedAdId = processHashing(advertising_id, 'sha256', 'hex', features, 'actions-reddit-conversions-api')
  return device_type === 'ios' ? { idfa: hashedAdId } : { aaid: hashedAdId }
}

function getDataProcessingOptions(
  dataProcessingOptions: DataProcessingOptionsType
): DatapProcessingOptions | undefined {
  if (!dataProcessingOptions) return undefined
  return {
    country: clean(dataProcessingOptions.country),
    modes: dataProcessingOptions.modes?.split(',').map((mode) => mode.trim()),
    region: clean(dataProcessingOptions.region)
  }
}

function getScreen(height?: number, width?: number): { height: number; width: number } | undefined {
  if (height === undefined || width === undefined) return undefined
  return {
    height,
    width
  }
}

function getUser(
  user: UserType,
  dataProcessingOptions: DataProcessingOptionsType,
  screenDimensions: ScreenDimensionsType,
  features?: Features
): User | undefined {
  if (!user) return

  return {
    ...getAdId(user.device_type, user.advertising_id, features),
    email: processHashing(
      user.email ?? '',
      'sha256',
      'hex',
      features,
      'actions-reddit-conversions-api',
      canonicalizeEmail
    ),
    external_id: processHashing(
      user.external_id ?? '',
      'sha256',
      'hex',
      features,
      'actions-reddit-conversions-api',
      (value) => value.trim()
    ),
    ip_address: processHashing(
      user.ip_address ?? '',
      'sha256',
      'hex',
      features,
      'actions-reddit-conversions-api',
      (value) => value.trim()
    ),
    user_agent: clean(user.user_agent),
    uuid: clean(user.uuid),
    data_processing_options: getDataProcessingOptions(dataProcessingOptions),
    screen_dimensions: getScreen(screenDimensions?.height, screenDimensions?.width)
  }
}

function canonicalizeEmail(value: string): string {
  value = value.trim()
  const localPartAndDomain = value.split('@')
  const localPart = localPartAndDomain[0].replace(/\./g, '').split('+')[0]
  return `${localPart.toLowerCase()}@${localPartAndDomain[1].toLowerCase()}`
}
