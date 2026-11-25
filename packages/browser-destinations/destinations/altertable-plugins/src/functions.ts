import {
  deviceIdPrefix,
  sessionExpirationTimeMs,
  sessionIdPrefix,
  storageDeviceIdKey,
  storageLastEventAtKey,
  storageSessionIdKey
} from './constants'

export interface PluginStorage {
  get: (key: string) => unknown
  set: (key: string, value: string) => unknown
}

export const storageFallback: PluginStorage = {
  get: (key: string) => window.localStorage.getItem(key),
  set: (key: string, value: string) => window.localStorage.setItem(key, value)
}

const readStorage = (storage: PluginStorage, key: string): unknown => {
  try {
    return storage.get(key)
  } catch {
    return null
  }
}

const writeStorage = (storage: PluginStorage, key: string, value: string): void => {
  try {
    storage.set(key, value)
  } catch {
    return
  }
}

export const generateId = (prefix: string): string => {
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).substring(2)
  return `${prefix}-${id}`
}

export const resolveSessionId = (storage: PluginStorage, now: number): string => {
  const storedId = readStorage(storage, storageSessionIdKey)
  const lastEventAt = Number(readStorage(storage, storageLastEventAtKey))

  const isRecent = Number.isFinite(lastEventAt) && lastEventAt > 0 && now - lastEventAt <= sessionExpirationTimeMs

  let sessionId: string
  if (typeof storedId === 'string' && storedId !== '' && isRecent) {
    sessionId = storedId
  } else {
    sessionId = generateId(sessionIdPrefix)
    writeStorage(storage, storageSessionIdKey, sessionId)
  }
  writeStorage(storage, storageLastEventAtKey, String(now))

  return sessionId
}

export const resolveDeviceId = (storage: PluginStorage): string => {
  const storedId = readStorage(storage, storageDeviceIdKey)
  if (typeof storedId === 'string' && storedId !== '') {
    return storedId
  }

  const deviceId = generateId(deviceIdPrefix)
  writeStorage(storage, storageDeviceIdKey, deviceId)
  return deviceId
}

export const getViewport = (): string | null => {
  try {
    const { innerWidth, innerHeight } = window
    return innerWidth > 0 && innerHeight > 0 ? `${innerWidth}x${innerHeight}` : null
  } catch {
    return null
  }
}
