export interface EpsilonPayload {
  id: string
  jsonrpc: "2.0"
  method: "syncEvent"
  params: {
    appId: string
    dtm_event: string // standard field 
    version: string
    eventData: BaseEventData | NonTransactionEventData | TransactionEventData
  }
}

export interface BaseEventData {
    dtm_cid: string // standard field 
    dtm_cmagic: string // standard field 
    dtm_fid: string // standard field  
    dtm_promo_id?: string // standard field 
    idfa?: string // standard field 
    google_play_id?: string // standard field 
    idfv?: string // standard field 
    google_app_set_id?: string // standard field 
    dtm_user_agent?: string // standard field 
    dtm_user_ip?: string // standard field 
    dtm_email_hash?: string // standard field 
    dtm_mobile_hash?: string // standard field 
    dtm_user_id?: string // standard field 
}

export interface NonTransactionEventData extends BaseEventData {
    dtmc_department?: string
    dtmc_category?: string
    dtmc_sub_category?: string
    dtmc_product_id?: string
    dtmc_brand?: string
    dtmc_upc?: string
    dtmc_mpn?: string
}

export interface TransactionEventData extends BaseEventData {
    dtmc_transaction_id: string
    dtm_conv_val: string
    dtm_items: {
    product_id: string
        item_amount: string
        item_quantity: string
        item_discount?: string
    }[]
    dtm_conv_curr: string
    dtmc_conv_type: string
    dtmc_store_location: string
}