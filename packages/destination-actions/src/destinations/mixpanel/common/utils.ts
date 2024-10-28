import { JSONLikeObject, ModifiedResponse, MultiStatusResponse } from '@segment/actions-core'

export enum ApiRegions {
  US = 'US 🇺🇸',
  EU = 'EU 🇪🇺'
}

export enum StrictMode {
  ON = '1',
  OFF = '0'
}

export function getConcatenatedName(firstName: unknown, lastName: unknown, name: unknown): unknown {
  return name ?? (firstName && lastName ? `${firstName} ${lastName}` : undefined)
}

export function getApiServerUrl(apiRegion: string | undefined) {
  if (apiRegion == ApiRegions.EU) {
    return 'https://api-eu.mixpanel.com'
  }
  return 'https://api.mixpanel.com'
}

export function getBrowser(userAgent: string): string {
  if (userAgent.includes(' OPR/')) {
    if (userAgent.includes('Mini')) {
      return 'Opera Mini'
    }
    return 'Opera'
  } else if (/(BlackBerry|PlayBook|BB10)/i.test(userAgent)) {
    return 'BlackBerry'
  } else if (userAgent.includes('IEMobile') || userAgent.includes('WPDesktop')) {
    return 'Internet Explorer Mobile'
  } else if (userAgent.includes('SamsungBrowser/')) {
    // https://developer.samsung.com/internet/user-agent-string-format
    return 'Samsung Internet'
  } else if (userAgent.includes('Edge') || userAgent.includes('Edg/')) {
    return 'Microsoft Edge'
  } else if (userAgent.includes('FBIOS')) {
    return 'Facebook Mobile'
  } else if (userAgent.includes('Chrome')) {
    return 'Chrome'
  } else if (userAgent.includes('CriOS')) {
    return 'Chrome iOS'
  } else if (userAgent.includes('UCWEB') || userAgent.includes('UCBrowser')) {
    return 'UC Browser'
  } else if (userAgent.includes('FxiOS')) {
    return 'Firefox iOS'
  } else if (userAgent.includes('Safari')) {
    if (userAgent.includes('iPhone')) {
      return `Mobile Safari`
    }
    return 'Safari'
  } else if (userAgent.includes('Android')) {
    return 'Android Mobile'
  } else if (userAgent.includes('Konqueror')) {
    return 'Konqueror'
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox'
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
    return 'Internet Explorer'
  } else if (userAgent.includes('Gecko')) {
    return 'Mozilla'
  } else {
    return ''
  }
}

export function getBrowserVersion(userAgent: string) {
  const browser = getBrowser(userAgent)

  const versionRegexs: { [browser: string]: RegExp } = {
    'Internet Explorer Mobile': /rv:(\d+(\.\d+)+)/,
    'Microsoft Edge': /Edge?\/(\d+(\.\d+)+)/,
    Chrome: /Chrome\/(\d+(\.\d+)+)/,
    'Chrome iOS': /CriOS\/(\d+(\.\d+)+)/,
    'UC Browser': /(UCBrowser|UCWEB)\/(\d+(\.\d+)+)/,
    Safari: /Version\/(\d+(\.\d+)+)/,
    'Mobile Safari': /Version\/(\d+(\.\d+)+)/,
    Opera: /(Opera|OPR)\/(\d+(\.\d+)+)/,
    Firefox: /Firefox\/(\d+(\.\d+)+)/,
    'Firefox iOS': /FxiOS\/(\d+(\.\d+)+)/,
    Konqueror: /Konqueror:(\d+(\.\d+)+)/,
    BlackBerry: /BlackBerry (\d+(\.\d+)+)/,
    'Android Mobile': /android\s(\d+(\.\d+)+)/,
    'Samsung Internet': /SamsungBrowser\/(\d+(\.\d+)+)/,
    'Internet Explorer': /(rv:|MSIE )(\d+(\.\d+)+)/,
    Mozilla: /rv:(\d+(\.\d+)+)/
  }
  const regex = versionRegexs[browser]
  if (!regex) return regex
  const matches = regex.exec(userAgent)
  if (!matches) {
    return undefined
  }

  return matches[matches.length - 2]
}

export function cheapGuid(maxlen?: number) {
  const guid = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
  return maxlen ? guid.substring(0, maxlen) : guid
}

export type MixpanelTrackApiResponseType = {
  code: number
  status: string
  error?: string
  num_records_imported?: number
  failed_records?: {
    index: number
    insert_id: string
    field: string
    message: string
  }[]
}

export function transformPayloadsType(obj: object[]) {
  const jsonObj = obj as JSONLikeObject[]
  return jsonObj.length
}

export async function handleMixPanelApiResponse(
  payloadCount: number,
  apiResponse: ModifiedResponse<MixpanelTrackApiResponseType>,
  multiStatusResponse: MultiStatusResponse,
  events: JSONLikeObject[]
) {
  if (apiResponse.data.code === 400) {
    apiResponse.data.failed_records?.map((data) => {
      multiStatusResponse.setErrorResponseAtIndex(data.index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: data.message
      })
    })
  } else if (apiResponse.data.code !== 200) {
    for (let i = 0; i < payloadCount; i++) {
      multiStatusResponse.setErrorResponseAtIndex(i, {
        status: apiResponse.data.code,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: apiResponse.data.error ?? 'Payload validation error',
        sent: events[i],
        body: apiResponse.data.error
      })
    }
  }
}
