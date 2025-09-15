// The field name to include for the Nextdoor click_id Querystring in the context.integrations.Nextdoor Conversions Api.click_id
export const clickIdIntegrationFieldName = 'click_id'

// The name of the Nextdoor click_id querystring to retrieve when the page loads
export const clickIdQuerystringName = 'ndclid'

// The name of the key Segment will use when storing the ndclid locally in the browser
export const clickIdCookieName = 'ndclid'

export const CLOUD_INTEGRATION_NAME = 'Nextdoor Conversions API'

export const storageFallback = {
  get: (key: string) => {
    const data = window.localStorage.getItem(key)
    return data
  },
  set: (key: string, value: string) => {
    return window.localStorage.setItem(key, value)
  }
}
