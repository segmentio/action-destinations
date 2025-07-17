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
  dtmc_conv_store_location,
  customEventName
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
    dtmc_conv_store_location,
    customEventName
  },
  perform: (request, { payload, settings }) => {
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
      customEventName,
      identifiers: {
        deviceID,
        advertisingId,
        dtm_user_agent,
        dtm_user_ip,
        dtm_email_hash,
        dtm_mobile_hash,
        dtm_user_id
      } = {}
    } = payload

    const { dtm_cid } = settings

    let eventData: BaseEventData | NonTransactionEventData | TransactionEventData = {
      dtmc_tms: 9,
      dtm_cid: dtm_cid.trim(),
      dtm_cmagic: processHashing(dtm_cid, 'md5', 'hex', (value: string) => value?.trim()).substring(0, 6),
      dtm_fid,
      dtm_promo_id,
      idfa: deviceType === 'ios' ? advertisingId : undefined,
      google_play_id: deviceType === 'android' ? advertisingId : undefined,
      idfv: deviceType === 'ios' ? deviceID : undefined,
      google_app_set_id: deviceType === 'android' ? deviceID : undefined,
      dtm_user_agent,
      dtm_user_ip,
      dtm_email_hash: dtm_email_hash
        ? processHashing(dtm_email_hash, 'sha256', 'hex', (value: string) => value?.trim().toLowerCase())
        : undefined,
      dtm_mobile_hash: dtm_mobile_hash
        ? processHashing(dtm_mobile_hash, 'sha256', 'hex', (value: string) => value?.trim().toLowerCase())
        : undefined,
      dtm_user_id
    }

    switch (dtm_event) {
      case 'department': {
        const updated: NonTransactionEventData = {
          ...eventData,
          dtmc_department
        }

        eventData = updated
        break
      }
      case 'category': {
        const updated: NonTransactionEventData = {
          ...eventData,
          dtmc_department,
          dtmc_category
        }
        eventData = updated
        break
      }
      case 'sub_category': {
        const updated: NonTransactionEventData = {
          ...eventData,
          dtmc_department,
          dtmc_category,
          dtmc_sub_category
        }
        eventData = updated
        break
      }
      case 'product':
      case 'addFavorites':
      case 'addSavedList':
      case 'cart': {
        const updated: NonTransactionEventData = {
          ...eventData,
          dtmc_department,
          dtmc_category,
          dtmc_sub_category,
          dtmc_product_id,
          dtmc_brand,
          dtmc_upc,
          dtmc_mpn
        }
        eventData = updated
        break
      }
      case 'conversion': {
        const updated: TransactionEventData = {
          ...eventData,
          dtmc_transaction_id,
          dtm_conv_val: dtm_conv_val as number,
          dtm_items: dtm_items as TransactionEventData['dtm_items'],
          dtm_conv_curr: dtm_conv_curr as string,
          dtmc_conv_type: dtmc_conv_type as string,
          dtmc_conv_store_location: dtmc_conv_store_location as string
        }
        eventData = updated
        break
      }
      case 'custom': {
        const updated: CustomEventData = {
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
        }
        eventData = updated
      }
    }

    const json: EpsilonPayload = {
      id,
      jsonrpc: '2.0',
      method: 'syncEvent',
      params: {
        appId,
        dtm_event: dtm_event === 'custom' ? (customEventName as string) : dtm_event,
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
