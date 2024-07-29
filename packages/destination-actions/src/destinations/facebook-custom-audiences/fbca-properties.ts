import { GlobalSetting } from '@segment/actions-core'

export const adAccountId: GlobalSetting = {
  type: 'string',
  label: 'Advertiser Account ID',
  description: 'Your advertiser account id. Read [more](https://www.facebook.com/business/help/1492627900875762).',
  required: true
}

// A hardcoded list of all possible schema properties that can be sent to Facebook.
// If the payloads do not contain a value for one of these schema properties, then empty string will be sent
export const SCHEMA_PROPERTIES = [
  'EXTERN_ID',
  'EMAIL',
  'PHONE',
  'GEN',
  'DOBY',
  'DOBM',
  'DOBD',
  'LN',
  'FN',
  'FI',
  'CT',
  'ST',
  'ZIP',
  'MADID',
  'COUNTRY'
]

// A list of the segment equivalent to each Facebook schema property
// It is important that each segment schema property is in the same order as the Facebook schema properties
export const SEGMENT_SCHEMA_PROPERTIES = [
  'externalId',
  'email',
  'phone',
  'gender',
  'year',
  'month',
  'day',
  'last',
  'first',
  'firstInitial',
  'city',
  'state',
  'zip',
  'mobileAdId',
  'country'
]

export const segmentSchemaKeyToArrayIndex = new Map<string, number>(
  SEGMENT_SCHEMA_PROPERTIES.map((property, index) => [property, index])
)
