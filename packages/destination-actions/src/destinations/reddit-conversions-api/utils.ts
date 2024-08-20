import type { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './standardEvent/generated-types'
import { StandardEventPayloadItem, StandardEventPayload, User, Product, EventMetadata, DatapProcessingOptions } from './types'
import { createHash } from 'crypto'

export async function send(request: RequestClient, settings: Settings, payload: Payload) {
    const data = createRedditPayload(payload)
    return request(`https://ads-api.reddit.com/api/v2.0/conversions/events/${settings.ad_account_id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${settings.conversion_token}` },
        json: {
        data: data
        }
    })
}
  
function createRedditPayload(payload: Payload): StandardEventPayload {
    const { event_at, event_type, click_id, products, user, data_processing_options, screen_dimensions, event_metadata } = payload
    const payloadItem: StandardEventPayloadItem = {
      event_at: event_at as string,
      event_type: {
        tracking_type: event_type.tracking_type
      },
      click_id: clean(click_id),
      event_metadata: getMetadata(event_metadata, products),
      user: getUser(user, data_processing_options, screen_dimensions)
    }
    return {
      events: [payloadItem],
      partner: 'SEGMENT'
    }
}
 
function clean(str: string | undefined): string | undefined {
    if(str === undefined || str === null || str === '') return undefined
    return str.trim()
}

function cleanNum(num: number | undefined): number | undefined {
    if(num === undefined || num === null) return undefined
    return num
}

function getProducts(products: Payload['products']): Product[] | undefined {
  if (!products) {
    return undefined
  }
  
  return products.map(product => {
    return {
      category: clean(product.category),
      id: clean(product.id),
      name: clean(product.name)
    }
  })
} 

function getMetadata(metadata: Payload['event_metadata'], products: Payload['products']): EventMetadata | undefined {
  if (!metadata) {
      return undefined
  }

  return {
      currency: clean(metadata?.currency),
      item_count: cleanNum(metadata?.item_count), 
      value_decimal: cleanNum(metadata?.value_decimal),
      products: getProducts(products)
  }
}

function getAdId(device_type?: string, advertising_id?: string): {[key:string]: string | undefined} | undefined {
    if (!device_type) return undefined 
    if (!advertising_id) return undefined
    return device_type === 'Apple' ? { idfa: hash(advertising_id) } : { aaid: hash(advertising_id) } 
}

function getDataProcessingOptions(dataProcessingOptions: Payload['data_processing_options']): DatapProcessingOptions | undefined {  
    if (!dataProcessingOptions) return undefined
    return {
      country: clean(dataProcessingOptions.country),
      modes: dataProcessingOptions.modes?.split(',').map(mode => mode.trim()),
      region: clean(dataProcessingOptions.region)
    }
}

function getScreen(height?: number, width?: number): {height: number, width: number} | undefined {
  if(height === undefined || width === undefined) return undefined
  return {
    height,
    width
  }
}

function getUser(user: Payload['user'], dataProcessingOptions: Payload['data_processing_options'], screenDimensions: Payload['screen_dimensions']): User | undefined {
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