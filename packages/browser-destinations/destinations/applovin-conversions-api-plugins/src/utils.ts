export const integrationName = 'AppLovin Conversions Api'

export const aleidQuerystringName = 'aleid'
export const alartQuerystringName = 'alart'

export const storageAleidKey = 'analytics_applovin_aleid'
export const storageAlartKey = 'analytics_applovin_alart'

export const aleidCookieName = '_axeid'
export const alartCookieName = '_axart'
export const axwrtCookieName = '_axwrt'
export const axwrtServerCookieName = 'axwrt'

export const aleidIntegrationFieldName = 'aleid'
export const alartIntegrationFieldName = 'alart'
export const axwrtIntegrationFieldName = 'axwrt'

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

export const getCookieValue = (cookieName: string): string | null => {
  const name = cookieName + '='
  const decodedCookie = decodeURIComponent(document.cookie)
  const cookieArray = decodedCookie.split('; ')

  for (const cookie of cookieArray) {
    if (cookie.startsWith(name)) {
      return cookie.substring(name.length) || null
    }
  }

  return null
}

export const setCookieValue = (cookieName: string, value: string): void => {
  document.cookie = `${cookieName}=${encodeURIComponent(value)}; max-age=${ONE_YEAR_IN_SECONDS}; path=/; SameSite=Lax`
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
