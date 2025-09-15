import { transformCart } from '../transformFields/transformCart'
import { transformCartLine } from '../transformFields/transformCartLine'
import { transformCheckout } from '../transformFields/transformCheckout'
import { transformCollection } from '../transformFields/transformCollection'
import { transformCommonFields } from '../transformFields/transformCommonFields'
import { transformCustomer } from '../transformFields/transformCustomer'
import { transformForm } from '../transformFields/transformForm'
import { transformProductVariant } from '../transformFields/transformProductVariant'
import { transformSearch } from '../transformFields/transformSearch'
import { Payload } from './generated-types'

export function transformPayload(payload: Payload) {
  const commonFields = transformCommonFields(payload)

  const result = {
    ...commonFields,
    custom_event_name: payload.customEventName,
    data: {
      ...commonFields.data,
      ...transformCustomer(payload),
      ...transformCart(payload),
      ...transformCartLine(payload),
      ...transformCheckout(payload),
      ...transformCollection(payload),
      ...transformForm(payload),
      ...transformProductVariant(payload),
      ...transformSearch(payload)
    }
  }

  return result
}
