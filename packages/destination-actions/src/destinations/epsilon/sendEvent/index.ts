import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { EpsilonPayload, BaseEventData, NonTransactionEventData, TransactionEventData, CustomEventData } from './types'
import { 
  standardFields, 
  dtmc_department,    
  dtmc_category,
  dtmc_sub_category,
  dtmc_product_id,
  dtmc_brand,
  dtmc_upc,
  dtmc_mpn,
  dtmc_transaction_id,
  dtm_conv_val,
  dtm_items,
  dtm_conv_curr,
  dtmc_conv_type,
  dtmc_conv_store_location

} from './fields'
import { URL } from './constants'
import { processHashing } from '../../../lib/hashing-utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Standard Fields Event',
  description: 'Sync an event containing standard fields only to Epsilon',
  defaultSubscription: 'type = "track"',
  fields: {
    ...standardFields,
    dtmc_department,
    dtmc_category,
    dtmc_sub_category,
    dtmc_product_id,
    dtmc_brand,
    dtmc_upc,
    dtmc_mpn,
    dtmc_transaction_id,
    dtm_conv_val,
    dtm_items,
    dtm_conv_curr,
    dtmc_conv_type,
    dtmc_conv_store_location
  },
  perform: (request, {payload, settings}) => {

    const {
      id,
      appId,
      dtm_event,
      version,
      dtm_fid,
      dtm_promo_id,
      deviceType,
      dtmc_department,
      dtmc_category,
      dtmc_sub_category,
      dtmc_product_id,
      dtmc_brand,
      dtmc_upc,
      dtmc_mpn,
      dtmc_transaction_id,
      dtm_conv_val,
      dtm_items,
      dtm_conv_curr,
      dtmc_conv_type,
      dtmc_conv_store_location,
      identifiers: {
        deviceID,
        advertisingId,
        dtm_user_agent,
        dtm_user_ip,
        dtm_email_hash,
        dtm_mobile_hash,
        dtm_user_id
      } = {},
    } = payload

    const {
      dtm_cid
    } = settings 

    let eventData: BaseEventData | NonTransactionEventData | TransactionEventData = {
        dtmc_tms: 9,
        dtm_cid:  dtm_cid.trim(),
        dtm_cmagic: processHashing(dtm_cid, 'md5', 'hex', (value: string) => value?.trim()).substring(0, 5),
        dtm_fid,
        dtm_promo_id,
        idfa: deviceType === 'ios' ? advertisingId : undefined,
        google_play_id: deviceType === 'android' ? advertisingId : undefined,
        idfv: deviceType === 'ios' ? deviceID : undefined,
        google_app_set_id: deviceType === 'android' ? deviceID : undefined,
        dtm_user_agent,
        dtm_user_ip,
        dtm_email_hash: dtm_email_hash ? processHashing(dtm_email_hash, 'sha256', 'hex', (value: string) => value?.trim().toLowerCase()): undefined,
        dtm_mobile_hash: dtm_mobile_hash ? processHashing(dtm_mobile_hash, 'sha256', 'hex', (value: string) => value?.trim().toLowerCase()): undefined,
        dtm_user_id
    }

    switch(dtm_event){
      case 'department':
        eventData = {
          ...eventData,
          dtmc_department
        } satisfies NonTransactionEventData
        break
      case 'category':
        eventData = {
          ...eventData,
          dtmc_department,
          dtmc_category
        } satisfies NonTransactionEventData
        break;
      case 'sub_category':
        eventData = {
          ...eventData,
          dtmc_department,
          dtmc_category,
          dtmc_sub_category
        } satisfies NonTransactionEventData
        break;
      case 'product':
      case 'addFavorites':
      case 'addSavedList':
      case 'cart':
        eventData = {
          ...eventData,
          dtmc_department,
          dtmc_category,
          dtmc_sub_category,
          dtmc_product_id,
          dtmc_brand,
          dtmc_upc,
          dtmc_mpn
        } satisfies NonTransactionEventData
        break;
      case 'conversion':
        eventData = {
          ...eventData,
          dtmc_transaction_id,
          dtm_conv_val: dtm_conv_val as number,
          dtm_items: dtm_items as TransactionEventData['dtm_items'],
          dtm_conv_curr: dtm_conv_curr as string,
          dtmc_conv_type: dtmc_conv_type as string,
          dtmc_conv_store_location: dtmc_conv_store_location as string,
        } satisfies TransactionEventData
        break
      case 'custom':
        eventData = {
          ...eventData,
          dtmc_department,
          dtmc_category,
          dtmc_sub_category,
          dtmc_product_id,
          dtmc_brand,
          dtmc_upc,
          dtmc_mpn, 
          dtmc_transaction_id,
          dtm_conv_val,
          dtm_items,
          dtm_conv_curr,
          dtmc_conv_type,
          dtmc_conv_store_location  
        } satisfies CustomEventData
    }

    const json: EpsilonPayload = {
      id, 
      jsonrpc: '2.0',
      method: 'syncEvent',
      params: {
        appId,
        dtm_event,
        version,
        eventData
      }
    }

    return request(URL, {
      method: 'post',
      json
    })
  }
}

export default action
