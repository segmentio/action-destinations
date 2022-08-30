import { InputField } from '@segment/actions-core'

export const customFields: InputField = {
  label: 'Other Fields',
  description: `
  Additional fields to send to Sendgrid. On the left-hand side, input the Sendgrid field API name. On the right-hand side, map the Segment field that contains the value.

  This can include standard or custom fields. Custom fields must be predefined in your Sendgrid account and the API field name should have __c appended.

  ---

  `,
  type: 'object',
  defaultObjectUI: 'keyvalue'
}

// export const fetchCustomFields  = (request: RequestClient, settings: Settings) => {
//    return request('https://api.sendgrid.com/v3/marketing/field_definitions', {
//      method: 'get',
//      headers: {
//       authorization: `Bearer ${settings.sendGridApiKey}`
//     }
//   })
// }
