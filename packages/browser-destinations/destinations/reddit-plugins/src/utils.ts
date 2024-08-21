// The field name to include for the Reddit click_id Querystring in the context.integrations.Reddit Conversions Api.click_id
export const clickIdIntegrationFieldName = 'click_id'

// The name of the Reddit click_id querystring to retrieve when the page loads
export const clickIdQuerystringName = 'rdt_cid'

// The name of the key Segment will use when storing the rdt_cid locally in the browser
export const clickIdCookieName = 'rdt_cid_seg'

// The field name to include for the Reddit rdt_uuid in the context.integrations.Reddit Conversions Api.rdt_uuid
export const rdtUUIDIntegrationFieldName = 'uuid'

// The name of the Reddit rdt_uuid cookie
export const rdtCookieName = '_rdt_uuid'

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
