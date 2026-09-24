import { InvalidAuthenticationError } from '@segment/actions-core'

type PayloadWithCustomFields = { custom_fields?: { [k: string]: unknown } }

export function validateDomain(domain: string): void {
  if (!/^[a-zA-Z0-9-]+$/.test(domain)) {
    throw new InvalidAuthenticationError(
      'Invalid domain. Domain must contain only alphanumeric characters and hyphens.'
    )
  }
}

export function addCustomFieldsFromPayloadToEntity<E extends object>(payload: PayloadWithCustomFields, entity: E) {
  if (!payload.custom_fields) {
    return
  }
  Object.assign(entity, payload.custom_fields)
}
