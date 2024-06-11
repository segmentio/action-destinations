import { Payload } from './generated-types'
import { transformPayload as transformBasePayload } from '../saveBaseEvent/transform-payload'
import { transformCartPayload } from '../saveCartEvent/transform-payload'
import { transformCheckoutPayload } from '../saveCheckoutEvent/transform-payload'
import { transformCollectionPayload } from '../saveCollectionEvent/transform-payload'
import { transformFormPayload } from '../saveFormEvent/transform-payload'
import { transformProductPayload } from '../saveProductEvent/transform-payload'
import { transformSearchPayload } from '../saveSearchEvent/transform-payload'

export function transformPayload(payload: Payload) {
  const basePayload = transformBasePayload(payload)
  const cartPayload = transformCartPayload(payload)
  const checkoutPayload = transformCheckoutPayload(payload)
  const collectionPayload = transformCollectionPayload(payload)
  const formPayload = transformFormPayload(payload)
  const productPayload = transformProductPayload(payload)
  const searchPayload = transformSearchPayload(payload)

  const result = {
    ...basePayload,
    ...cartPayload,
    ...checkoutPayload,
    ...collectionPayload,
    ...formPayload,
    ...productPayload,
    ...searchPayload
  }

  return result
}
