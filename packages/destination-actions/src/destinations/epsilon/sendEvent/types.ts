export type EpsilonPayload = {
  id: string;
  jsonrpc: '2.0';
  method: 'syncEvent';
  params: {
    appId: string;
    dtm_event: string;
    version: string;
    eventData: BaseEventData | NonTransactionEventData | TransactionEventData
  };
};

export type BaseEventData = {
    dtmc_tms: 9 // standard field - indicates Segment Partner / vendor
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

export type NonTransactionEventData = BaseEventData & {
    dtmc_department?: string
    dtmc_category?: string
    dtmc_sub_category?: string
    dtmc_product_id?: string
    dtmc_brand?: string
    dtmc_upc?: string
    dtmc_mpn?: string
}

export type TransactionEventData = BaseEventData & {
    dtmc_transaction_id: string
    dtm_conv_val: number
    dtm_items: {
      product_id: string
      item_amount: number
      item_quantity: number
      item_discount?: number
      [k : string]: unknown
    }[]
    dtm_conv_curr: string
    dtmc_conv_type: string
    dtmc_conv_store_location: string
}

export type CustomEventData = Partial<
  BaseEventData &
  NonTransactionEventData &
  TransactionEventData
>