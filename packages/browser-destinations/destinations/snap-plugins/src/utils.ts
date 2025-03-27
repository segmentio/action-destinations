// The name of the storage location where we'll cache the Snap click_id Querystring value
export const storageClickIdKey = 'analytics_snap_capi_click_id'

// The name of the storage location where we'll cache the Snap scid cookie value
export const storageSCIDCookieKey = 'analytics_snap_capi_scid_cookie'

// The name of the Snap click_id querystring to retrieve when the page loads
export const clickIdQuerystringName = 'ScCid'

// The name of the Snap cookie to retrieve to retrieve when the page loads
export const scidCookieName = '_scid'

// The field name to include for the Snap scid cookie in the context.integrations.snap_conversions_api
export const scidIntegrationFieldName = 'uuid_c1'

// The field name to include for the Snap click_id Querystring in the context.integrations.snap_conversions_api
export const clickIdIntegrationFieldName = 'click_id'

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
