export interface Payload {
  purchaseProperties?: {
    [k: string]: unknown
  }
  products?: {
    product_id: string
    price: number
    currency?: string
    quantity?: number
  }[]
}
