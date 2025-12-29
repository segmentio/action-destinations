/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Context mapping from Segment to Altertable format
 */
const contextMapping: Record<string, string> = {
  ip: '$ip',
  'page.url': '$url',
  'page.referrer': '$referer',
  'os.name': '$os',
  userAgent: '$user_agent'
}

/**
 * Helper to get nested property value
 */
export function getNestedValue(obj: any, path: string): any {
  return path
    .split('.')
    .reduce(
      (current, key) => (typeof current === 'object' && current !== null && key in current ? current[key] : undefined),
      obj
    )
}

/**
 * Parse and transform Segment context to Altertable properties
 */
export function parseContext(context?: object): Record<string, any> {
  if (!context) {
    return {}
  }

  const result: Record<string, any> = {}

  // Special handling for campaign data
  if ('campaign' in context && context.campaign !== null && typeof context.campaign === 'object') {
    Object.entries(context.campaign).forEach(([key, value]) => {
      const utmKey = ((k) => {
        switch (k) {
          case 'name':
          case 'campaign':
            return '$utm_campaign'
          case 'source':
          case 'term':
          case 'content':
          case 'medium':
            return `$utm_${k}`
          default:
            return `utm_${k}`
        }
      })(key)
      result[utmKey] = value
    })
  }

  // Map known context properties to Altertable properties
  Object.entries(contextMapping).forEach(([segmentPath, altertableProp]) => {
    const value = getNestedValue(context, segmentPath)
    if (value !== undefined) {
      result[altertableProp] = value
    }
  })

  // Special handling for screen size
  const screenWidth = getNestedValue(context, 'screen.width')
  const screenHeight = getNestedValue(context, 'screen.height')
  if (screenWidth && screenHeight) {
    result['$viewport'] = `${screenWidth}x${screenHeight}`
  }

  // Special handling for library data
  result['$lib'] = getNestedValue(context, 'library.name') || 'altertable-segment'
  const libraryVersion = getNestedValue(context, 'library.version')
  if (libraryVersion) {
    result['$lib_version'] = libraryVersion
  }

  return result
}
