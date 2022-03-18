export interface Payload {
  external_id?: string
  user_alias?: {
    alias_name?: string
    alias_label?: string
  }
  braze_id?: string | null
  time: string | number
  products: {
    product_id: string
    currency?: string
    price: number
    quantity?: number
  }[]
  properties?: {
    [k: string]: unknown
  }
  _update_existing_only?: boolean
}
