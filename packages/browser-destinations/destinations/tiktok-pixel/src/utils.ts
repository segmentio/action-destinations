import { Payload } from './reportWebEvent/generated-types'
import { formatPhone, handleArrayInput, formatString, formatAddress } from './formatter'
import { TTUser } from './types'

export function getUserObject(payload: Payload): TTUser {
  return buildUserObject(payload)
}

function buildUserObject(payload: Payload): TTUser {
  return {
    email: handleArrayInput(payload.email),
    phone_number: formatPhone(handleArrayInput(payload.phone_number)),
    external_id: handleArrayInput(payload.external_id),
    first_name: formatString(payload.first_name),
    last_name: formatString(payload.last_name),
    city: formatAddress(payload.address?.city),
    state: formatAddress(payload.address?.state),
    country: formatAddress(payload.address?.country),
    zip_code: formatString(payload.address?.zip_code)
  }
}
