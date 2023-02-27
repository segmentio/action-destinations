import { Payload } from './updateUserProfile/generated-types'

export const API_BASE = 'https://unification.useinsider.com/api/'
export const UPSERT_ENDPOINT = 'user/v1/upsert'

export function userProfilePayload(data: Payload) {
  return {
    users: [
      {
        identifiers: {
          uuid: data.uuid,
          custom: {
            segment_anonymous_id: data.segment_anonymous_id
          }
        },
        attributes: {
          age: data.age,
          birthday: data.birthday,
          email: data.email,
          name: data.firstName,
          gender: data.gender,
          surname: data.lastName,
          phone_number: data.phone,
          city: data.city,
          country: data.country,
          email_optin: data.emailOptin,
          sms_optin: data.smsOptin,
          whatsapp_optin: data.whatsappOptin,
          language: data.language
        }
      }
    ]
  }
}
