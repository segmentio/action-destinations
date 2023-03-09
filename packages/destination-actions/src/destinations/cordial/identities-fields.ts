import {InputField} from "@segment/actions-core";

export const userIdentityFields : Record<string, InputField> = {
  segmentId: {
    label: 'Segment User ID',
    description: 'Segment User ID value',
    type: 'hidden',
    required: false,
    default: { '@path': '$.userId' }
  },
  anonymousId: {
    label: 'Segment Anonymous ID',
    description: 'Segment Anonymous ID value',
    type: 'hidden',
    required: false,
    default: { '@path': '$.anonymousId' }
  },
  userIdentities: {
    label: 'User Identities',
    description:
      'An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. If a contact is found using the identifiers it is updated, otherwise a new contact is created.',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue:only'
  },
}

export default userIdentityFields;
