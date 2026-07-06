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
import { REDDIT_CONVERSIONS_API_VERSION } from './versioning-info'
import {
  EventMetadataType,
  ProductsType,
  ConversionIdType,
  DataProcessingOptionsType,
  UserType,
  ScreenDimensionsType,
  clean,
  cleanNum,
  getScreen,
  canonicalizeEmail,
  smartHash,
  cleanPhoneNumber,
  getAdId
} from './shared'

const V2_URL = (adAccountId: string) =>
  `https://ads-api.reddit.com/api/${REDDIT_CONVERSIONS_API_VERSION}/conversions/events/${adAccountId}`

export async function sendV2(request: RequestClient, settings: Settings, payload: StandardEvent[] | CustomEvent[]) {
  const data = createRedditPayload(payload, settings)
  return request(V2_URL(settings.ad_account_id), {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.conversion_token}` },
    json: JSON.parse(JSON.stringify(data))
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
    conversion_id: smartHash(conversion_id, (value) => value.trim())
  }
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

function getUser(
  user: UserType,
  dataProcessingOptions: DataProcessingOptionsType,
  screenDimensions: ScreenDimensionsType
): User | undefined {
  if (!user) return

  return {
    ...getAdId(user.device_type, user.advertising_id),
    email: smartHash(user.email, canonicalizeEmail),
    external_id: smartHash(user.external_id, (value) => value.trim()),
    ip_address: smartHash(user.ip_address, (value) => value.trim()),
    user_agent: clean(user.user_agent),
    uuid: clean(user.uuid),
    data_processing_options: getDataProcessingOptions(dataProcessingOptions),
    screen_dimensions: getScreen(screenDimensions?.height, screenDimensions?.width),
    phone_number: smartHash(user.phone_number, cleanPhoneNumber)
  }
}
