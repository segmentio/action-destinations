// The name of the storage location where we'll cache the Rokt rtid Querystring value
export const storageRTIDKey = 'analytics_rokt_capi_rtid'

// The name of the Rokt rtid querystring to retrieve when the page loads
export const rtidQuerystringName = 'rtid'

// The field name to include for the Rokt rtid cookie in the "context.integrations.Rokt Conversions API" object
export const rtidIntegrationFieldName = 'rtid'

export const storageFallback = {
  get: (key: string) => {
    const data = window.localStorage.getItem(key)
    return data
  },
  set: (key: string, value: string) => {
    return window.localStorage.setItem(key, value)
  }
}
