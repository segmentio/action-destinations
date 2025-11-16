export interface EcommerceEvent {
    events: Array<MultiProductEvent | SingleProductEvent>
} 

export interface MultiProductEvent {
    external_id: string
    app_id: string
    name: 'ecommerce.cart_updated' 
        | 'ecommerce.checkout_started' 
        | 'ecommerce.order_placed' 
        | 'ecommerce.order_cancelled' 
        | 'ecommerce.order_refunded'
    time: string
    properties: {
        cancel_reason: string
        checkout_id: string
        cart_id: string
        total_value: number
        products: Array<Product>
        currency: string
        total_discount: number
        discounts: Array<{
            code: string
            amount: number
        }>
        source: string
        metadata: {
          checkout_url: string
          order_status_url: string
          [key: string]: unknown
        }
    }
}

export interface SingleProductEvent {
    external_id: string
    app_id: string
    name: 'ecommerce.product_viewed' 
    time: string
    properties: (Product & {
        checkout_id: string
        cart_id: string
        total_value: number
        currency: string
        total_discount: number
        discounts: Array<{
            code: string
            amount: number
        }>
        source: string,
        metadata: {
          [key: string]: unknown
        },
        type: Array<string>
    })
}

export interface Product {
    product_id: string
    product_name: string
    variant_id: string
    quantity: number
    price: number
    metadata: {
        [key: string]: unknown
    }
}