import { InputField } from '@segment/actions-core'
import { Directive } from '@segment/actions-core/destination-kit/types'

export const userID: InputField = {
  label: 'Segment User ID',
  description: 'Permanent identifier of a Segment user the event is attributed to.',
  type: 'string',
  dynamic: true,
  default: {
    '@path': '$.userId'
  }
}

export const anonymousID: InputField = {
  label: 'Segment Anonymous User ID',
  description: 'A pseudo-unique substitute for a Segment user ID the event is attributed to.',
  type: 'string',
  default: {
    '@path': '$.anonymousId'
  }
}

export const email: InputField = {
  label: 'Email',
  description: 'Identified email of the Segment User.',
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.traits.email' },
      then: { '@path': '$.traits.email' },
      else: { '@path': '$.properties.email' }
    }
  }
}

export const url: InputField = {
  label: 'URL',
  description: 'URL associated with the event.',
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.properties.url' },
      then: { '@path': '$.properties.url' },
      else: { '@path': '$.context.page.url' }
    }
  }
}

export const referrerUrl: InputField = {
  label: 'Referrer URL',
  description: 'Referrer URL associated with the event.',
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.properties.referrer' },
      then: { '@path': '$.properties.referrer' },
      else: { '@path': '$.context.page.referrer' }
    }
  }
}

export const userAgent: InputField = {
  label: 'User Agent',
  description: 'User Agent associated with the event.',
  type: 'string',
  default: {
    '@path': '$.context.userAgent'
  }
}

export const timestamp: InputField = {
  label: 'Event Timestamp',
  description: 'When the event was sent.',
  type: 'datetime',
  default: {
    '@path': '$.timestamp'
  }
}

export const kind = (defaultValue: string): InputField => {
  return {
    label: 'Custom Event Kind',
    description:
      'Type of the SalesWings custom event (a custom event is visualized in SalesWings cockpit and SalesForce Lead Intent View as "[[Kind]] Data").',
    type: 'string',
    default: defaultValue,
    required: true
  }
}

export const data = (defaultValue: Directive): InputField => {
  return {
    label: 'Custom Event Data',
    description:
      'String description of the SalesWings custom event payload (a custom event is visualized in SalesWings cockpit and SalesForce Lead Intent View as "[[Kind]] Data").',
    type: 'string',
    default: defaultValue,
    required: true
  }
}

export const values = (defaultValue: Directive): InputField => {
  return {
    label: 'Custom Attribute Values',
    description: 'Custom attribute values associated with the SalesWings custom event.',
    type: 'object',
    default: defaultValue
  }
}
