import { Settings } from '../generated-types'
import { getRegionalEndpoint } from '../sendgrid-properties'

export const RESERVED_HEADERS = [
  'x-sg-id',
  'x-sg-eid',
  'received',
  'dkim-signature',
  'Content-Type',
  'Content-Transfer-Encoding',
  'To',
  'From',
  'Subject',
  'Reply-To',
  'CC',
  'BCC'
]

export const MAX_CATEGORY_LENGTH = 255

export const MIN_IP_POOL_NAME_LENGTH = 2

export const MAX_IP_POOL_NAME_LENGTH = 64

export const sendEmailURL = (settings: Settings) => {
  const regionalEndpoint = getRegionalEndpoint(settings)
  return `${regionalEndpoint}/v3/mail/send`
}

export const getTemplatesURL = (settings: Settings) => {
  const regionalEndpoint = getRegionalEndpoint(settings)
  return `${regionalEndpoint}/v3/templates?generations=dynamic&page_size=200`
}

export const TRUNCATE_CHAR_LENGTH = 25

export const getIPPoolsURL = (settings: Settings) => {
  const regionalEndpoint = getRegionalEndpoint(settings)
  return `${regionalEndpoint}/v3/ips/pools`
}

export const getValidDomainsURL = (settings: Settings) => {
  const regionalEndpoint = getRegionalEndpoint(settings)
  return `${regionalEndpoint}/v3/whitelabel/domains?limit=200`
}

export const getGroupIDsURL = (settings: Settings) => {
  const regionalEndpoint = getRegionalEndpoint(settings)
  return `${regionalEndpoint}/v3/asm/groups`
}
export const getTemplateContentURL = (settings: Settings, templateId: string) => {
  const regionalEndpoint = getRegionalEndpoint(settings)
  return `${regionalEndpoint}/v3/templates/${templateId}`
}
