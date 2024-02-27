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

export enum DataStreamType {
  'Web' = 'Web',
  'MobileApp' = 'Mobile App'
}

export interface DataStreamParams {
  search_params: string
  // only one of app_instance_id or client_id is allowed
  identifier: { app_instance_id: string; client_id?: never } | { client_id: string; app_instance_id?: never }
}

export interface Consent {
  ad_personalization_consent?: string
  ad_user_data_consent?: string
}
