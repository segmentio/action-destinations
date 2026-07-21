export interface Product {
  sku?: string
  price?: number
  quantity?: number
  name?: string
  category?: string
}

export interface EventData {
  total?: number
  products?: Product[]
  currency?: string
  order_id?: string
  [key: string]: unknown
}

export interface EventTarget {
  ref?: string
  email?: string
  phone?: string
  id?: number
}

export interface EventItem {
  event: {
    target: EventTarget
    data: EventData
    type: string
  }
}

export type TaguchiEventJSON = EventItem[]

export type EventResponseJSON = {
  code: number
  name: string
  description: string
}[]
