import type { Settings } from '../generated-types'
import type { JwtPayload } from './types'

export const parseJwt = (token: string): JwtPayload => {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
}

export const getBaseUrl = (settings: Settings) => {
  try {
    const url = parseJwt(settings.apiKey)
      .iss.replace(/auth-token/g, 'api')
      .slice(0, -1)
    return url
  } catch (e) {
    return 'https://api.devrev.ai'
  }
}

export const getDevOrgId = (settings: Settings) => {
  return parseJwt(settings.apiKey)['http://devrev.ai/devo_don']
}

export const getDevUserId = (settings: Settings) => {
  return parseJwt(settings.apiKey).sub
}

export const isBlacklisted = (settings: Settings, domain: string) => {
  const blacklistedDomains = settings.blacklistedDomains?.split(',')
  if (!blacklistedDomains) return false
  return blacklistedDomains.includes(domain)
}

export const getDomain = (settings: Settings, email: string) => {
  const domain = email.split('@')[1]
  if (isBlacklisted(settings, domain)) return email
  return domain
}

export const isOlderThen = (firstDate: string, secondDate: string) => {
  const first = new Date(firstDate)
  const second = new Date(secondDate)
  return first < second
}

interface getNameInterface {
  firstName?: string
  lastName?: string
  fullName?: string
}

export const getName = (payload: getNameInterface) => {
  const { firstName, lastName, fullName } = payload
  if (fullName) return fullName
  if (firstName && lastName) return `${firstName} ${lastName}`
  if (firstName) return firstName
  if (lastName) return lastName
  return ''
}
