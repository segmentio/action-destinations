import { EVENT_NAMES } from './constants'
import { Payload } from './generated-types'

export interface PayloadWithIndex extends Payload {
    index?: number
}

export type ProductViewedEventName = typeof EVENT_NAMES.PRODUCT_VIEWED
export type CheckoutStartedEventName = typeof EVENT_NAMES.CHECKOUT_STARTED
export type CartUpdatedEventName = typeof EVENT_NAMES.CART_UPDATED 
export type OrderPlacedEventName = typeof EVENT_NAMES.ORDER_PLACED 
export type OrderCancelledEventName = typeof EVENT_NAMES.ORDER_CANCELLED
export type OrderRefundedEventName = typeof EVENT_NAMES.ORDER_REFUNDED

export type MultiPropertyEventName = 
   CheckoutStartedEventName |
   CartUpdatedEventName | 
   OrderPlacedEventName | 
   OrderCancelledEventName | 
   OrderRefundedEventName

export interface EcommerceEvents {
    events: Array<EcommerceEvent>
} 

export type EcommerceEvent =
    | ProductViewedEvent
    | CartUpdatedEvent
    | CheckoutStartedEvent
    | OrderPlacedEvent
    | OrderRefundedEvent
    | OrderCancelledEvent

export interface BaseEvent {
    external_id?: string
    braze_id?: string
    email?: string
    phone?: string
    user_alias?: {
        alias_name: string
        alias_label: string
    },
    app_id?: string
    name: ProductViewedEventName | MultiPropertyEventName
    time: string
    properties: {
        currency: string
        source: string
        metadata?: {
            [key: string]: unknown
        }
    },
    _update_existing_only?: boolean
}

export interface ProductViewedEvent extends BaseEvent {
    name: ProductViewedEventName
    properties: BaseEvent['properties'] & {
        product_id: string
        product_name: string
        variant_id: string
        price: number
        image_url?: string
        product_url?: string
        type?: Array<string>
    }
}

export interface MultiProductBaseEvent extends BaseEvent {
    name: MultiPropertyEventName
    properties: BaseEvent['properties'] & {
        total_value: number
        products: Array<{
            product_id: string
            product_name: string
            variant_id: string
            quantity: number
            price: number
            image_url?: string
            product_url?: string
            metadata?: {
                [key: string]: unknown
            }
        }>
    }
}

export interface CartUpdatedEvent extends MultiProductBaseEvent {
    name: CartUpdatedEventName
    properties: MultiProductBaseEvent['properties'] & {
        cart_id: string
    }
}

export interface CheckoutStartedEvent extends MultiProductBaseEvent {
    name: CheckoutStartedEventName
    properties: MultiProductBaseEvent['properties'] & {
         checkout_id: string
         cart_id?: string
         metadata?: BaseEvent['properties']['metadata'] & {
            checkout_url?: string
         }
    }
}

export interface OrderPlacedEvent extends MultiProductBaseEvent {
    name: OrderPlacedEventName
    properties: MultiProductBaseEvent['properties'] & {
        order_id: string
        cart_id?: string
        total_discounts?: number
        discounts?: Array<{
            code: string
            amount: number
        }>
        metadata?: BaseEvent['properties']['metadata'] & {
            order_status_url?: string
        }
    }
}

export interface OrderRefundedEvent extends MultiProductBaseEvent {
    name: OrderRefundedEventName
    properties: MultiProductBaseEvent['properties'] & {
        order_id: string
        total_discounts?: number
        discounts?: Array<{
            code: string
            amount: number
        }>
        metadata?: BaseEvent['properties']['metadata'] & {
            order_status_url?: string
        }
    }
}

export interface OrderCancelledEvent extends MultiProductBaseEvent {
    name: OrderCancelledEventName
    properties: MultiProductBaseEvent['properties'] & {
        order_id: string
        cancel_reason: string
        total_discounts?: number
        discounts?: Array<{
            code: string
            amount: number
        }>
        metadata?: BaseEvent['properties']['metadata'] & {
            order_status_url?: string
        }
    }
}