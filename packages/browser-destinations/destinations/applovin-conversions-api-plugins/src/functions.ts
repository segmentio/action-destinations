export interface PluginStorage {
  get: (key: string) => unknown
  set: (key: string, value: string) => unknown
}

export const getCookieValue = (cookieName: string): string | null => {
  try {
    const name = cookieName + '='
    const cookieArray = decodeURIComponent(document.cookie).split('; ')

    for (const cookie of cookieArray) {
      if (cookie.startsWith(name)) {
        return cookie.substring(name.length) || null
      }
    }

    return null
  } catch {
    return null
  }
}

export const storageFallback: PluginStorage = {
  get: (key: string) => window.localStorage.getItem(key),
  set: (key: string, value: string) => window.localStorage.setItem(key, value)
}

export const readStorage = (storage: PluginStorage, key: string): string | null => {
  try {
    const value = storage.get(key)
    return typeof value === 'string' && value ? value : null
  } catch {
    return null
  }
}

export const writeStorage = (storage: PluginStorage, key: string, value: string): void => {
  try {
    storage.set(key, value)
  } catch {
    return
  }
}

export const resolveClickId = (
  storage: PluginStorage,
  { queryName, cookieName, storageKey }: { queryName: string; cookieName: string; storageKey: string }
): string | null => {
  const queryValue = new URLSearchParams(window.location.search).get(queryName)
  const storedValue = readStorage(storage, storageKey)
  const value = queryValue || getCookieValue(cookieName) || storedValue
  if (value && value !== storedValue) {
    writeStorage(storage, storageKey, value)
  }
  return value
}
