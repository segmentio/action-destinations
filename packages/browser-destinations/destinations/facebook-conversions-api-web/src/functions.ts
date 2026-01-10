import { WindowWithOptionalFbq, InitOptions, LDU, UserData, FBClient} from './types'
import type { Settings } from './generated-types'
import { USER_DATA_KEY, INIT_COUNT_KEY} from './constants'
import { UniversalStorage, Analytics } from '@segment/analytics-next'

export function initScript(settings: Settings, analytics: Analytics) {
  const { 
    pixelId, 
    disablePushState, 
    disableAutoConfig, 
    disableFirstPartyCookies,
    agent,
    ldu 
  } = settings as Settings & { ldu: keyof typeof LDU }

  (function(
    f: WindowWithOptionalFbq, 
    b: Document, 
    e: 'script', 
    v: string, 
    n: FBClient | undefined = undefined, 
    t: HTMLScriptElement | undefined = undefined, 
    s: Element | null = null
  ){
    if (f.fbq) return;
    n = f.fbq = function() {
      /* eslint-disable */
      // @ts-expect-error - n is defined by the time this executes
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      /* eslint-enable */
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    if (s && s.parentNode) {
      s.parentNode.insertBefore(t, s);
    }
  })(
    window, 
    document, 
    'script', 
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  if(ldu === LDU.Disabled.key) {
    window.fbq('dataProcessingOptions', [])
  }
  else {
    const lduObj = getLDU(ldu)
    window.fbq('dataProcessingOptions', ['LDU'], lduObj.country, lduObj.state)
  }

  if(disablePushState) {
    window.fbq.disablePushState = true
  } 

  if (disableAutoConfig) {
    window.fbq('set', 'autoConfig', false, pixelId)
  }

  if (disableFirstPartyCookies) {
    window.fbq('set', 'firstPartyCookies', false, pixelId)
  }

  const userData = getStoredUserData(analytics)
  const options: InitOptions | undefined = ( agent ? { agent } : undefined)
  const initArgs: [string, UserData?, InitOptions?] = [pixelId]

  if (userData && Object.keys(userData).length > 0) {
    initArgs.push(userData);
    if (options) {
      initArgs.push(options);
    }
  } else if (options) {
    initArgs.push(undefined, options)
  }

  window.fbq('init', ...initArgs)

  setStorageInitCount(analytics, 1)
  deleteStorageUserData(analytics)

  if(!disablePushState) {
    window.fbq('trackSingle', pixelId, 'PageView')
  }
}

export const storageFallback = {
  get: (key: string) => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Silently fail in private browsing
    }
  }
}

export function setStorageInitCount(analytics: Analytics, count: number) {
  const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
  storage.set(INIT_COUNT_KEY, `${count}`)
}

export function deleteStorageUserData(analytics: Analytics) {
  const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
  storage.set(USER_DATA_KEY, '')
}

function getStoredUserData(analytics: Analytics): UserData | undefined { 
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const userDataFromStorage: string | null = storage.get(USER_DATA_KEY)
    if(userDataFromStorage) {
        try {
            const parsed = JSON.parse(userDataFromStorage)
            if(!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.keys(parsed as object).length === 0) {
                return undefined
            }
            return parsed as UserData
        } catch {
            return undefined
        }
    }
    return undefined
}

function getLDU(ldu: keyof typeof LDU) {
    const lduObj = LDU[ldu]
    return { country: lduObj.country, state: lduObj.state }
}