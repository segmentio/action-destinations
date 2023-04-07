// import { Settings } from './generated-types'
// import { RequestOptions } from '@segment/actions-core'
//
// const apiBaseUrl = 'https://events.usermaven.com'
//
// /**
//  * Parameters intended to be passed into a RequestClient.
//  */
// interface RequestParams {
//   url: string
//   options: RequestOptions
// }
//
// /**
//  * Returns default {@link RequestParams} suitable for most UserMaven HTTP API requests.
//  *
//  * @param settings Settings configured for the cloud mode destination.
//  * @param relativeUrl The relative URL from the FullStory API domain root.
//  */
// const defaultRequestParams = (settings: Settings, relativeUrl: string): RequestParams => {
//   return {
//     url: `${apiBaseUrl}/${relativeUrl}?token=${settings.serverToken}`,
//     options: {
//       method: 'post',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     }
//   }
// }
