export interface EndpointDetails {
  apiKey: string
  url: string
}

const stgRegex = new RegExp(/^stg_/, 'i')

export const endpointApiKey = (apiKey: string): string => {
  return apiKey.replace(stgRegex, '')
}

export const endpointUrl = (apiKey: string): string => {
  const staging = stgRegex.test(apiKey)
  return staging ? 'https://instaging.accoil.com/segment' : 'https://in.accoil.com/segment'
}
