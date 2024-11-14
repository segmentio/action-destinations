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

export const SEND_EMAIL_URL = 'https://api.sendgrid.com/v3/mail/send'

export const GET_TEMPLATES_URL = 'https://api.sendgrid.com/v3/templates?generations=dynamic&page_size=200'

export const TRUNCATE_CHAR_LENGTH = 25

export const GET_IP_POOLS_URL = 'https://api.sendgrid.com/v3/ips/pools'

export const GET_VALID_DOMAINS_URL = 'https://api.sendgrid.com/v3/whitelabel/domains?limit=200'

export const GET_GROUP_IDS_URL = 'https://api.sendgrid.com/v3/asm/groups'

export const GET_TEMPLATE_CONTENT_URL = 'https://api.sendgrid.com/v3/templates/'
