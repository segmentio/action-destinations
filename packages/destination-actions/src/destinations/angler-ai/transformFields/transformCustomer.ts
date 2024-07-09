import { Payload } from '../saveCustomEvent/generated-types'

export function transformCustomer(payload: Payload) {
  return {
    customer: {
      id: payload.identifiers.userId,
      email: payload.customer?.email,
      firstName: payload.customer?.firstName,
      lastName: payload.customer?.lastName,
      phone: payload.customer?.phone,
      dob: payload.customer?.dob
    }
  }
}
