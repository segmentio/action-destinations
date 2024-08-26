import type { RequestClient } from '@segment/actions-core'
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
import { createHash } from 'crypto'

type EventMetadataType = StandardEvent['event_metadata'] | CustomEvent['event_metadata']
type ProductsType = StandardEvent['products'] | CustomEvent['products']
type ConversionIdType = StandardEvent['conversion_id'] | CustomEvent['conversion_id']
type DataProcessingOptionsType = StandardEvent['data_processing_options'] | CustomEvent['data_processing_options']
type UserType = StandardEvent['user'] | CustomEvent['user']
type ScreenDimensionsType = StandardEvent['screen_dimensions'] | CustomEvent['screen_dimensions']

export async function send(request: RequestClient, settings: Settings, payload: StandardEvent[] | CustomEvent[]) {
  const data = createRedditPayload(payload, settings)
  return request(`https://ads-api.reddit.com/api/v2.0/conversions/events/${settings.ad_account_id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.conversion_token}` },
    json: {
      // stringify to remove undefied values, then parse back to an object
      data: JSON.parse(JSON.stringify(data))
    }
  })
}

function createRedditPayload(payloads: StandardEvent[] | CustomEvent[], settings: Settings): StandardEventPayload {
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
      event_metadata: getMetadata(event_metadata, products, conversion_id),
      user: getUser(user, data_processing_options, screen_dimensions)
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
  conversion_id: ConversionIdType
): EventMetadata | undefined {
  if (!metadata && !products && !conversion_id) {
    return undefined
  }

  return {
    currency: clean(metadata?.currency),
    item_count: cleanNum(metadata?.item_count),
    value_decimal: cleanNum(metadata?.value_decimal),
    products: getProducts(products),
    conversion_id: clean(conversion_id)
  }
}

function getAdId(device_type?: string, advertising_id?: string): { [key: string]: string | undefined } | undefined {
  if (!device_type) return undefined
  if (!advertising_id) return undefined
  return device_type === 'Apple' ? { idfa: hash(advertising_id) } : { aaid: hash(advertising_id) }
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
  screenDimensions: ScreenDimensionsType
): User | undefined {
  if (!user) return

  return {
    ...getAdId(user.device_type, user.advertising_id),
    email: hash(clean(user.email)),
    external_id: hash(clean(user.external_id)),
    ip_address: hash(clean(user.ip_address)),
    opt_out: user.opt_out,
    user_agent: clean(user.user_agent),
    uuid: clean(user.uuid),
    data_processing_options: getDataProcessingOptions(dataProcessingOptions),
    screen_dimensions: getScreen(screenDimensions?.height, screenDimensions?.width)
  }
}

const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return
  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}
