import type { Settings } from '../generated-types'

export const parseJwt = (token: string) => {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
}

export const getDevOrgId = (settings: Settings) => {
  const { apiKey } = settings
  const parsed = parseJwt(apiKey)
  const orgId = parsed['http://devrev.ai/devo_don']
  return orgId
}

export const getDevUserId = (settings: Settings) => {
  const { apiKey } = settings
  const parsed = parseJwt(apiKey)
  const orgId = parsed['http://devrev.ai/devo_don']
  const userId = `${orgId}:devu/${parsed['']}`
  return userId
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
