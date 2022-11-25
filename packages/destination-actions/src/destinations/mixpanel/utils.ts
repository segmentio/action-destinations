export enum ApiRegions {
  US = 'US 🇺🇸',
  EU = 'EU 🇪🇺'
}

export function getConcatenatedName(firstName: unknown, lastName: unknown, name: unknown): unknown {
  return (
    name ?? (firstName && lastName ? `${ firstName } ${ lastName }` : undefined)
  )
}

export function getApiServerUrl(apiRegion: string | undefined) {
  if (apiRegion == ApiRegions.EU) {
    return 'https://api-eu.mixpanel.com'
  }
  return 'https://api.mixpanel.com'
}

export function getBrowser(userAgent: string, vendor: string | undefined): string {
  vendor = vendor || '' // vendor is undefined for at least IE9
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
  } else if (vendor.includes('Apple')) {
    if (userAgent.includes('Mobile')) {
      return 'Mobile Safari'
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

export function getBrowserVersion(userAgent: string, vendor: string | undefined) {
  const browser = getBrowser(userAgent, vendor)
  const versionRegexs: { [browser: string]: RegExp } = {
    'Internet Explorer Mobile': /rv:(\d+(\.\d+)?)/,
    'Microsoft Edge': /Edge?\/(\d+(\.\d+)?)/,
    Chrome: /Chrome\/(\d+(\.\d+)?)/,
    'Chrome iOS': /CriOS\/(\d+(\.\d+)?)/,
    'UC Browser': /(UCBrowser|UCWEB)\/(\d+(\.\d+)?)/,
    Safari: /Version\/(\d+(\.\d+)?)/,
    'Mobile Safari': /Version\/(\d+(\.\d+)?)/,
    Opera: /(Opera|OPR)\/(\d+(\.\d+)?)/,
    Firefox: /Firefox\/(\d+(\.\d+)?)/,
    'Firefox iOS': /FxiOS\/(\d+(\.\d+)?)/,
    Konqueror: /Konqueror:(\d+(\.\d+)?)/,
    BlackBerry: /BlackBerry (\d+(\.\d+)?)/,
    'Android Mobile': /android\s(\d+(\.\d+)?)/,
    'Samsung Internet': /SamsungBrowser\/(\d+(\.\d+)?)/,
    'Internet Explorer': /(rv:|MSIE )(\d+(\.\d+)?)/,
    Mozilla: /rv:(\d+(\.\d+)?)/
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
