export interface ProductItem {
  item_id?: string
  item_name?: string
  quantity?: number
  affiliation?: string
  coupon?: string
  discount?: number
  item_brand?: string
  item_category?: string
  item_variant?: string
  tax?: number
  price?: number
  currency?: string
}

export interface CartProductItem extends ProductItem {
  index?: number
}
