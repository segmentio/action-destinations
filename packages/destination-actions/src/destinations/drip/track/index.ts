// import type { ActionDefinition } from '@segment/actions-core'
// import type { Settings } from '../generated-types'
// import type { Payload } from './generated-types'

// import { endpointUrl } from '../utils'

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

//   perform: (request, data) => {
//     return request(endpointUrl(data.settings.api_key), {
//       method: 'post',
//       json: {
//         type: 'track',
//         event: data.payload.email,
//         userId: data.payload.action,
//         properties: data.payload.properties
//       }
//     })
//   }
// }

// export default action
