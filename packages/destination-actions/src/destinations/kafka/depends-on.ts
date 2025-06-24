import { DependsOnConditions } from '@segment/actions-core/destination-kittypes'

export const DEPENDS_ON_PLAIN_OR_SCRAM: DependsOnConditions = {
  match: 'any',
  conditions: [
    {
      fieldKey: 'mechanism',
      operator: 'is',
      value: 'plain'
    },
    {
      fieldKey: 'mechanism',
      operator: 'is',
      value: 'scram-sha-256'
    },
    {
      fieldKey: 'mechanism',
      operator: 'is',
      value: 'scram-sha-512'
    }
  ]
}
export const DEPEONDS_ON_AWS: DependsOnConditions = {
  conditions: [
    {
      fieldKey: 'mechanism',
      operator: 'is',
      value: 'aws'
    }
  ]
}
export const DEPENDS_ON_CLIENT_CERT: DependsOnConditions = {
  conditions: [
    {
      fieldKey: 'mechanism',
      operator: 'is',
      value: 'client-cert-auth'
    }
  ]
}
