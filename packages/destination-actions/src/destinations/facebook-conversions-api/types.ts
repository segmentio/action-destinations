import { EventType } from './constants'
import type { Payload as AddToCartPayload } from './addToCart/generated-types'
import type { Payload as AddToCart2Payload } from './addToCart2/generated-types'
import type { Payload as CustomPayload } from './custom/generated-types'
import type { Payload as Custom2Payload } from './custom2/generated-types'
import type { Payload as InitiateCheckoutPayload } from './initiateCheckout/generated-types'
import type { Payload as InitiateCheckout2Payload } from './initiateCheckout2/generated-types'
import type { Payload as PageViewPayload } from './pageView/generated-types'
import type { Payload as PageView2Payload } from './pageView2/generated-types'
import type { Payload as PurchasePayload } from './purchase/generated-types'
import type { Payload as Purchase2Payload } from './purchase2/generated-types'
import type { Payload as SearchPayload } from './search/generated-types'
import type { Payload as Search2Payload } from './search2/generated-types'
import type { Payload as ViewContentPayload } from './viewContent/generated-types'
import type { Payload as ViewContentPayload2 } from './viewContent2/generated-types'

export type AnyPayload =
    | PurchasePayload
    | Purchase2Payload
    | AddToCartPayload
    | AddToCart2Payload
    | ViewContentPayload
    | ViewContentPayload2
    | InitiateCheckoutPayload
    | InitiateCheckout2Payload
    | PageViewPayload
    | PageView2Payload
    | CustomPayload
    | Custom2Payload
    | SearchPayload
    | Search2Payload

export type EventDataType = 
    | PurchaseEventData 
    | AppendValueEventData 
    | AddToCartEventData 
    | ViewContentEventData 
    | InitiateCheckoutEventData 
    | PageEventData 
    | CustomEventData
    | SearchEventData

export type EventTypeKey = keyof typeof EventType

export interface RequestJSON {
    data: [EventDataType],
    test_event_code?: string
}

export interface BaseEventData {
    event_time: string
    action_source: string
    event_source_url?: string
    event_id?: string
    user_data: UserData
    app_data?: Record<string, unknown>
    data_processing_options?: string[]
    data_processing_options_country?: number
    data_processing_options_state?: number
}

export interface AddToCartEventData extends BaseEventData {
    event_name: 'AddToCart',
    custom_data: {
        currency: string,
        value?: number,
        content_ids?: string[],
        content_name?: string,
        content_type?: string,
        contents?: Array<{
            id?: string,
            quantity?: number,
            item_price?: number, 
            delivery_category?: string
        }>,
        [k: string]: unknown
    }
}

export interface CustomEventData extends BaseEventData {
    event_name: string,
    custom_data: {
        [k: string]: unknown
    }
}

export interface PageEventData extends BaseEventData {
    event_name: 'PageView'
}

export interface PurchaseEventData extends BaseEventData {
    event_name: 'Purchase',
    custom_data: {
        currency: string,
        value: number,
        order_id?: string,
        net_revenue?: number,
        predicted_ltv?: number,
        content_ids?: string[],
        content_name?: string,
        content_type?: string,
        contents?: Array<{
            id?: string,
            quantity?: number,
            item_price?: number, 
            delivery_category?: string
        }>,
        num_items?: number,
        [k: string]: unknown
    }
}

export interface InitiateCheckoutEventData extends BaseEventData {
    event_name: 'InitiateCheckout',
    custom_data: {
        currency: string,
        value?: number,
        content_ids?: string[],
        contents?: Array<{
            id?: string,
            quantity?: number,
            item_price?: number, 
            delivery_category?: string
        }>,
        num_items?: number,
        content_category?: string,
        [k: string]: unknown
    }
}

export interface SearchEventData extends BaseEventData {
    event_name: 'Search',
    custom_data: {
        currency: string,
        value?: number,
        content_ids?: string[],
        contents?: Array<{
            id?: string,
            quantity?: number,
            item_price?: number, 
            delivery_category?: string
        }>,
        content_category?: string,
        search_string?: string,
        [k: string]: unknown
    }
}

export interface ViewContentEventData extends BaseEventData {
    event_name: 'ViewContent',
    custom_data: {
        currency: string,
        value?: number,
        content_ids?: string[],
        content_name?: string,
        content_type?: string,
        contents?: Array<{
            id?: string,
            quantity?: number,
            item_price?: number, 
            delivery_category?: string
        }>,
        content_category?: string,
        [k: string]: unknown
    }
}

export interface AppendValueEventData extends BaseEventData {
    event_name: 'AppendValue'
    original_event_data: {
        event_name: string
        event_time?: string 
        order_id?: string
        event_id?: string
    }
    custom_data: {
        net_revenue?: number
        predicted_ltv?: number
        [k: string]: unknown
    }
}

export type GeneratedAppData = {
  advertiser_tracking_enabled: 1 | 0
  application_tracking_enabled: 1 | 0
  madid?: string
  extinfo: string[]
}

export interface UserData {
    em?: string
    ph?: string
    ge?: string
    db?: string
    ln?: string
    fn?: string
    ct?: string
    st?: string
    zp?: string
    country?: string
    external_id?: string[]
    client_ip_address?: string
    client_user_agent?: string
    fbc?: string
    fbp?: string
    subscription_id?: string
    lead_id?: number
    anon_id?: string
    madid?: string
    fb_login_id?: number
    partner_id?: string
    partner_name?: string
}

export type Content = {
  id?: string
  delivery_category?: string
}