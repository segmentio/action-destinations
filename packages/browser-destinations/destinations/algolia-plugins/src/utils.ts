// The name of the storage location where we'll cache the Query ID value
export const storageQueryIdKey = 'analytics_algolia_query_id'

export const queryIdQueryStringNameDefault = 'queryID'

// The field name to include for the Algolia query_id in 'context.integrations.Algolia Insights (Actions)'
export const queryIdIntegrationFieldName = 'query_id'

export const storageFallback = {
  get: (key: string) => {
    const data = window.localStorage.getItem(key)
    return data
  },
  set: (key: string, value: string) => {
    return window.localStorage.setItem(key, value)
  }
}
