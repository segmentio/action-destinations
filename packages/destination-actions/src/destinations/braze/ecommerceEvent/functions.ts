import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { 
  JSONLikeObject,
  RequestClient, 
  PayloadValidationError, 
  MultiStatusResponse 
} from '@segment/actions-core'
import type { 
  BaseEvent, 
  EcommerceEvents, 
  EcommerceEvent, 
  MultiPropertyEventName, 
  ProductViewedEventName, 
  ProductViewedEvent,
  MultiProductBaseEvent,
  CartUpdatedEvent,
  CheckoutStartedEvent,
  OrderPlacedEvent,
  OrderRefundedEvent,
  OrderCancelledEvent
} from './types'
import { EVENT_NAMES } from './constants'
import dayjs from 'dayjs'

export async function send(request: RequestClient, payloads: Payload[], settings: Settings, isBatch: boolean) {
  const msResponse = new MultiStatusResponse()
  const { endpoint } = settings
  const json = getJSON(payloads, settings, isBatch, msResponse)

  const url = isBatch ? `${endpoint}/users/track/batch` : `${endpoint}/users/track`

  const response = await request(url, {
    method: 'POST',
    json,
    headers: {
     'Content-Type': 'application/json'
    },
    timeout: 15000
  })

  return isBatch ? msResponse : response 
}


function getJSON(payloads: Payload[], settings: Settings, isBatch: boolean, msResponse: MultiStatusResponse): EcommerceEvents {
  
  const { app_id } = settings

  const events: EcommerceEvent[] = payloads.map((payload, index) => {
    
    const message = validate(payload, isBatch)
    
    if(message){
      msResponse.setErrorResponseAtIndex(
        index, 
        { 
          status: 400,
          errormessage: message,
          sent: payload as object as JSONLikeObject
        }
      )
    }

    const { 
      external_id,
      braze_id,
      email,
      phone,
      user_alias,
      name,
      time: payloadTime,
      currency,
      source
    } = payload

    const time = dayjs(payloadTime).toISOString()

    const event: BaseEvent = {
      ...(external_id? { external_id } : {} ),
      ...(braze_id? { braze_id } : {} ),
      ...(email? { email } : {} ),
      ...(phone? { phone } : {} ),
      ...(user_alias? { user_alias } : {} ),
      ...(app_id ? { app_id } : {} ),
      name: name as ProductViewedEventName | MultiPropertyEventName,
      time,
      properties: {
        currency,
        source
      }
    }

    switch(name) {
      case EVENT_NAMES.PRODUCT_VIEWED: {
        const {
          product,
          type
        } = payload

        const properties: ProductViewedEvent['properties'] = {
          ...event.properties,
          ...product,
          type
        }

        event.properties = properties
        return event
      } 
      case EVENT_NAMES.CART_UPDATED:
      case EVENT_NAMES.CHECKOUT_STARTED:
      case EVENT_NAMES.ORDER_PLACED:
      case EVENT_NAMES.ORDER_CANCELLED:
      case EVENT_NAMES.ORDER_REFUNDED: {
        const {
          products,
          total_value
        } = payload

        const properties: MultiProductBaseEvent['properties'] = {
          ...event.properties,
          products,
          total_value: total_value as number
        }

        event.properties = properties

        switch(name) {
          case EVENT_NAMES.CART_UPDATED: {
            const { cart_id } = payload

            const properties: CartUpdatedEvent['properties'] = {
              ...event.properties as MultiProductBaseEvent['properties'],
              cart_id: cart_id as string
            }

            event.properties = properties
            break
          }

          case EVENT_NAMES.CHECKOUT_STARTED: {
            const { 
              checkout_id, 
              cart_id, 
              metadata 
            } = payload
            
            const properties: CheckoutStartedEvent['properties'] = {
              ...event.properties as MultiProductBaseEvent['properties'],
              checkout_id: checkout_id as string,
              ...(cart_id ? { cart_id } : {}),
              ...(metadata ? { metadata } : {})
            }

            event.properties = properties
            break
          }

          case EVENT_NAMES.ORDER_PLACED: {
            const { 
              order_id,
              cart_id, 
              total_discounts, 
              discounts,
              metadata
            } = payload
            
            const properties: OrderPlacedEvent['properties'] = {
              ...event.properties as MultiProductBaseEvent['properties'],
              order_id: order_id as string,
              ...(typeof total_discounts === 'number' ? { total_discounts } : {}),
              ...(discounts ? { discounts } : {}),
              ...(cart_id ? { cart_id } : {}),
              ...(metadata ? { metadata } : {})
            }

            event.properties = properties
            break
          }

          case EVENT_NAMES.ORDER_REFUNDED: {
            const { 
              order_id,
              total_discounts, 
              discounts,
              metadata
            } = payload
            
            const properties: OrderRefundedEvent['properties'] = {
              ...event.properties as MultiProductBaseEvent['properties'],
              order_id: order_id as string,
              ...(typeof total_discounts === 'number' ? { total_discounts } : {}),
              ...(discounts ? { discounts } : {}),
              ...(metadata ? { metadata } : {})
            }

            event.properties = properties
            break
          }

          case EVENT_NAMES.ORDER_CANCELLED: {
            const { 
              order_id,
              cancel_reason,
              total_discounts, 
              discounts,
              metadata
            } = payload
            
            const properties: OrderCancelledEvent['properties'] = {
              ...event.properties as MultiProductBaseEvent['properties'],
              order_id: order_id as string,
              cancel_reason: cancel_reason as string,
              ...(typeof total_discounts === 'number' ? { total_discounts } : {}),
              ...(discounts ? { discounts } : {}),
              ...(metadata ? { metadata } : {})
            }

            event.properties = properties
            break
          }

          default: {
            throw new PayloadValidationError(`Unsupported event name: ${name}`)
          }
        }
        return event
      }
      default: {
        throw new PayloadValidationError(`Unsupported event name: ${name}`)
      }
    }
  })

  return { events }
}

function validate(payload: Payload, isBatch: boolean): string | void {
  const { braze_id, user_alias, external_id, email, phone } = payload
  if (!braze_id && !user_alias && !external_id && !email && !phone) {
    const message = 'One of "external_id" or "user_alias" or "braze_id" or "email" or "phone" is required.'
    if(!isBatch) {
      throw new PayloadValidationError(message)    
    } 
    else {
      return message
    }
  }
}

export function currencies() {
  const codes = [
    "AFN","EUR","ALL","DZD","USD","EUR","AOA","XCD","XCD","XAD","ARS","AMD",
    "AWG","AUD","EUR","AZN","BSD","BHD","BDT","BBD","BYN","EUR","BZD","XOF",
    "BMD","INR","BTN","BOB","BOV","USD","BAM","BWP","NOK","BRL","USD","BND",
    "BGN","XOF","BIF","CVE","KHR","XAF","CAD","KYD","XAF","XAF","CLP","CLF",
    "CNY","AUD","AUD","COP","COU","KMF","CDF","XAF","NZD","CRC","XOF","EUR",
    "CUP","XCG","EUR","CZK","DKK","DJF","XCD","DOP","USD","EGP","SVC","USD",
    "XAF","ERN","EUR","SZL","ETB","EUR","FKP","DKK","FJD","EUR","EUR","EUR",
    "XPF","EUR","XAF","GMD","GEL","EUR","GHS","GIP","EUR","DKK","XCD","EUR",
    "USD","GTQ","GBP","GNF","XOF","GYD","HTG","USD","AUD","EUR","HNL","HKD",
    "HUF","ISK","INR","IDR","XDR","IRR","IQD","EUR","GBP","ILS","EUR","JMD",
    "JPY","GBP","JOD","KZT","KES","AUD","KPW","KRW","KWD","KGS","LAK","EUR",
    "LBP","LSL","ZAR","LRD","LYD","CHF","EUR","EUR","MOP","MGA","MWK","MYR",
    "MVR","XOF","EUR","USD","EUR","MRU","MUR","EUR","XUA","MXN","MXV","USD",
    "MDL","EUR","MNT","EUR","XCD","MAD","MZN","MMK","NAD","ZAR","AUD","NPR",
    "EUR","XPF","NZD","NIO","XOF","NGN","NZD","AUD","MKD","USD","NOK","OMR",
    "PKR","USD","PAB","USD","PGK","PYG","PEN","PHP","NZD","PLN","EUR","USD",
    "QAR","EUR","RON","RUB","RWF","EUR","SHP","XCD","XCD","EUR","EUR","XCD",
    "WST","EUR","STN","SAR","XOF","RSD","SCR","SLE","SGD","XCG","XSU","EUR",
    "EUR","SBD","SOS","ZAR","SSP","EUR","LKR","SDG","SRD","NOK","SEK","CHF",
    "CHE","CHW","SYP","TWD","TJS","TZS","THB","USD","XOF","NZD","TOP","TTD",
    "TND","TRY","TMT","USD","AUD","UGX","UAH","AED","GBP","USD","USD","USN",
    "UYU","UYI","UYW","UZS","VUV","VES","VED","VND","USD","USD","XPF","MAD",
    "YER","ZMW","ZWG"
  ]

  const unique = Array.from(new Set(codes))

  return unique.map(code => ({
    label: code,
    value: code
  }))
}
