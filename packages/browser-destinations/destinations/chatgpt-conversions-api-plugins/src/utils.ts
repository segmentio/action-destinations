export const storageOpprefKey = 'analytics_chatgpt_conversions_api_oppref'

export const opprefQuerystringName = 'oppref'

export const obrefCookieName = '__obref'

export const integrationName = 'ChatGPT Conversions API'

export const opprefIntegrationFieldName = 'oppref'

export const obrefIntegrationFieldName = 'obref'

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export const getQuerystringValue = (search: string, name: string): string | null => {
  const pairs = search.replace(/^\?/, '').split('&')

  for (const pair of pairs) {
    const separatorIndex = pair.indexOf('=')
    const key = separatorIndex === -1 ? pair : pair.substring(0, separatorIndex)
    if (safeDecode(key) === name) {
      const value = separatorIndex === -1 ? '' : safeDecode(pair.substring(separatorIndex + 1))
      return value === '' ? null : value
    }
  }

  return null
}

export const getCookieValue = (cookieName: string): string | null => {
  const name = cookieName + '='

  for (const cookie of document.cookie.split('; ')) {
    if (cookie.startsWith(name)) {
      const value = cookie.substring(name.length)
      return value === '' ? null : value
    }
  }

  return null
}

export const storageFallback = {
  get: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      return
    }
  }
}
