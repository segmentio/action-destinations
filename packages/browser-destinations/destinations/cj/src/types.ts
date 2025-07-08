

export interface CJ {
  sitePage: {
    enterpriseId: number,
    pageType: string,
    referringChannel?: string,
    cartSubtotal?: number,
    items?: Item[],
    userId?: string
  },
  order: SimpleOrder | AdvancedOrder
}

export interface Item {
    unitPrice: number
    itemId: string
    quantity: number
    discount?: number
}

export interface SimpleOrder {
  enterpriseId: number
  pageType?: string
  userId?: string
  emailHash?: string
  orderId: string
  actionTrackerId?: string // This is required. If not provided, log a warning to the console.  
  currency: string
  amount: number // should default to 0 if not provided
  discount?: number
  coupon?: string
  cjeventOrder?: string //required whenever advertiser uses their own cookie to store the Event ID
}

export interface AdvancedOrder extends SimpleOrder {
  items: Item[]
}

