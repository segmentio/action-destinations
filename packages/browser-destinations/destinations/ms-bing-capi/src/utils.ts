// The name of the storage location where we'll cache the MS Bing msclkid Querystring value
export const storageClickIdKey = 'analytics_ms_capi_click_id'

// The name of the MS Bing msclkid querystring to retrieve when the page loads
export const clickIdQuerystringName = 'msclkid'

// The field name to include for the Microsoft Bing CAPI msclkid Querystring in the 'context.integrations.Microsoft Bing CAPI' object
export const clickIdIntegrationFieldName = 'msclkid'

export const getCookieValue = (cookieName: string): string | null => {
  const name = cookieName + '='
  const decodedCookie = decodeURIComponent(document.cookie)
  const cookieArray = decodedCookie.split('; ')

  for (const cookie of cookieArray) {
    if (cookie.startsWith(name)) {
      return cookie.substring(name.length)
    }
  }

  return null
}

export const storageFallback = {
  get: (key: string) => {
    const data = window.localStorage.getItem(key)
    return data
  },
  set: (key: string, value: string) => {
    return window.localStorage.setItem(key, value)
  }
}
