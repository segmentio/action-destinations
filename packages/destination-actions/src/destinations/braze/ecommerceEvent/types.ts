export type SinglePropertyEventName = 'ecommerce.product_viewed' 

export type CheckoutStartedEventName = 'ecommerce.checkout_started'

export type CartUpdatedEventName = 'ecommerce.cart_updated' 

export type OrderPlacedEventName = 'ecommerce.order_placed' 

export type OrderCancelledEventName = 'ecommerce.order_cancelled'

export type OrderRefundedEventName = 'ecommerce.order_refunded'

export type MultiPropertyEventName = 
   CheckoutStartedEventName |
   CartUpdatedEventName | 
   OrderPlacedEventName | 
   OrderCancelledEventName | 
   OrderRefundedEventName

export interface EcommerceEvent {
    events: Array<
        SingleProductEvent | 
        CartUpdatedEvent | 
        CheckoutStartedEvent | 
        OrderPlacedEvent | 
        OrderRefundedEvent |
        OrderCancelledEvent  
    >
} 
export interface BaseEvent {
    external_id?: string
    braze_id?: string
    email?: string
    phone?: string
    user_alias?: {
        alias_name: string
        alias_label: string
    },
    app_id: string
    name: SinglePropertyEventName | MultiPropertyEventName
    time: string
    properties: {
        currency: string
        source: string
        metadata?: {
            [key: string]: unknown
        }
    }
}

export interface SingleProductEvent extends BaseEvent {
    name: SinglePropertyEventName
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
         metadata: BaseEvent['properties']['metadata'] & {
            checkout_url?: string
         }
    }
}

export interface OrderPlacedEvent extends MultiProductBaseEvent {
    name: OrderPlacedEventName
    properties: MultiProductBaseEvent['properties'] & {
        order_id: string
        cart_id?: string
        total_discount?: number
        discounts?: Array<{
            code: string
            amount: number
        }>
        metadata: BaseEvent['properties']['metadata'] & {
            order_status_url?: string
        }
    }
}

export interface OrderRefundedEvent extends MultiProductBaseEvent {
    name: OrderRefundedEventName
    properties: MultiProductBaseEvent['properties'] & {
        order_id: string
        total_discount?: number
        discounts?: Array<{
            code: string
            amount: number
        }>
        metadata: BaseEvent['properties']['metadata'] & {
            order_status_url?: string
        }
    }
}

export interface OrderCancelledEvent extends MultiProductBaseEvent {
    name: OrderCancelledEventName
    properties: MultiProductBaseEvent['properties'] & {
        order_id: string
        cancel_reason: string
        total_discount?: number
        discounts?: Array<{
            code: string
            amount: number
        }>
        metadata: BaseEvent['properties']['metadata'] & {
            order_status_url?: string
        }
    }
}







       
                    
       