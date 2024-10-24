// import type { ActionDefinition } from '@segment/actions-core'
// import type { Settings } from '../generated-types'
// import type { Payload } from './generated-types'

// import { baseUrl } from '../constants'

// const action: ActionDefinition<Settings, Payload> = {
//   title: 'Track',
//   description: '',
//   fields: {
//     description: 'The name of the event.',
//     email: {
//       label: 'Email Address',
//       required: true,
//       type: 'string',
//       format: 'email',
//       default: { '@path': '$.traits.email' }
//     },
//     action: {
//       description: 'The name of the action.',
//       label: 'Action',
//       required: true,
//       type: 'string',
//       default: {
//         '@path': '$.event'
//       }
//     },
//     properties: {
//       description: 'A JSON object containing additional properties that will be associated with the event.',
//       label: 'Properties',
//       required: false,
//       type: 'object',
//       default: {
//         '@path': '$.properties'
//       }
//     }
//   },

//   perform: (request, { settings, payload }) => {
//     const encodedApiKey = Buffer.from(`${settings.apiKey}:`).toString('base64')

//     return request(`${baseUrl}/v2/events`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Basic ${encodedApiKey}`
//       },
//       json: {
//         type: 'track',
//         email: payload.email,
//         userId: payload.action,
//         properties: payload.properties
//       }
//     })
//   }
// }

// export default action
