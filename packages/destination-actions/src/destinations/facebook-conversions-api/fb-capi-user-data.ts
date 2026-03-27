import { US_STATE_CODES, COUNTRY_CODES } from './constants'
import { Payload } from './addToCart/generated-types'
import isEmpty from 'lodash/isEmpty'
import { processHashing } from '../../lib/hashing-utils'


type UserData = Pick<Payload, 'user_data'>

const isHashedInformation = (information: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(information)

const hash = (value: string | string[] | undefined): string | string[] | undefined => {
  if (value === undefined || !value.length) return

  if (typeof value == 'string') {
    return processHashing(value, 'sha256', 'hex')
  }

  return value.map((el: string) => processHashing(el, 'sha256', 'hex'))
}

/**
 * Normalization of user data properties according to Facebooks specifications.
 * @param payload
 * @see https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences#hash
 */
export const normalize_user_data = (payload: UserData) => {
  if (payload.user_data.email) {
    // Regex removes all whitespace in the string.
    payload.user_data.email = payload.user_data.email.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.phone && !isHashedInformation(payload.user_data.phone)) {
    // Regex removes all non-numeric characters from the string.
    payload.user_data.phone = payload.user_data.phone.replace(/\D/g, '')
  }

  if (payload.user_data.gender) {
    payload.user_data.gender = payload.user_data.gender.replace(/\s/g, '').toLowerCase()
    switch (payload.user_data.gender) {
      case 'male':
        payload.user_data.gender = 'm'
        break
      case 'female':
        payload.user_data.gender = 'f'
        break
    }
  }

  if (payload.user_data.lastName) {
    payload.user_data.lastName = payload.user_data.lastName.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.firstName) {
    payload.user_data.firstName = payload.user_data.firstName.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.city) {
    payload.user_data.city = payload.user_data.city.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.state) {
    payload.user_data.state = payload.user_data.state.replace(/\s/g, '').toLowerCase()

    if (US_STATE_CODES.has(payload.user_data.state)) {
      payload.user_data.state = US_STATE_CODES.get(payload.user_data.state)
    }
  }

  if (payload.user_data.zip) {
    payload.user_data.zip = payload.user_data.zip.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.country) {
    payload.user_data.country = payload.user_data.country.replace(/\s/g, '').toLowerCase()

    if (COUNTRY_CODES.has(payload.user_data.country)) {
      payload.user_data.country = COUNTRY_CODES.get(payload.user_data.country)
    }
  }

  if (!isEmpty(payload.user_data?.externalId)) {
    // TO handle the backward compatibility where externalId can be string
    if (typeof payload.user_data?.externalId === 'string') {
      payload.user_data.externalId = [payload.user_data?.externalId]
    }
    payload.user_data.externalId = payload.user_data.externalId?.map((el: string) =>
      el.replace(/\s/g, '').toLowerCase()
    )
  }
}

export const hash_user_data = (payload: UserData): Object => {
  normalize_user_data(payload)
  // Hashing this is recommended but not required
  return {
    em: hash(payload.user_data?.email),
    ph: hash(payload.user_data?.phone),
    ge: hash(payload.user_data?.gender),
    db: hash(payload.user_data?.dateOfBirth),
    ln: hash(payload.user_data?.lastName),
    fn: hash(payload.user_data?.firstName),
    ct: hash(payload.user_data?.city),
    st: hash(payload.user_data?.state),
    zp: hash(payload.user_data?.zip),
    country: hash(payload.user_data?.country),
    external_id: hash(payload.user_data?.externalId), //to provide support for externalId as string and array both
    client_ip_address: payload.user_data?.client_ip_address,
    client_user_agent: payload.user_data?.client_user_agent,
    fbc: payload.user_data?.fbc,
    fbp: payload.user_data?.fbp,
    subscription_id: payload.user_data?.subscriptionID,
    lead_id: payload.user_data?.leadID,
    anon_id: payload.user_data?.anonId,
    madid: payload.user_data?.madId,
    fb_login_id: payload.user_data?.fbLoginID,
    partner_id: payload.user_data?.partner_id,
    partner_name: payload.user_data?.partner_name
  }
}
