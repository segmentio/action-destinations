// export interface EndpointDetails {
//   apiKey: string
//   url: string
// }

// const stagingRegex = new RegExp(/^staging_/, 'i')

// export const endpointApiKey = (apiKey: string): string => {
//   return apiKey.replace(stagingRegex, '')
// }

// export const endpointUrl = (apiKey: string): string => {
//   const staging = stagingRegex.test(apiKey)
//   return staging ? 'https://app-staging.getdrip.com/3977335/workflows/977330340/actions/r0w3kahed6be256' : 'https://app.getdrip.com/3977335/workflows/977330340/actions/r0w3kahed6be256'
// }
