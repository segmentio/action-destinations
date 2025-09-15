export interface ProductItem {
  item_id?: string
  item_name?: string
  affiliation?: string
  coupon?: string
  currency?: string
  discount?: number
  index?: number
  item_brand?: string
  item_category?: string
  item_category2?: string
  item_category3?: string
  item_category4?: string
  item_category5?: string
  item_list_id?: string
  item_list_name?: string
  item_variant?: string
  location_id?: string
  price?: number
  quantity?: number
}

export interface PromotionProductItem extends ProductItem {
  creative_name?: string
  creative_slot?: string
  promotion_id?: string
  promotion_name?: string
}
