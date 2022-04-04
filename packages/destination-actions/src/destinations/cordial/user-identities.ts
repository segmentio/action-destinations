import { InputField } from '@segment/actions-core'

export const userIdentities: Record<string, InputField> = {
  userIdentities: {
    label: 'User Identities object',
    description: 'Mapping to identify contact on Cordial side. Should be provided in form of cordialKey (path to the primary or secondary Cordial Contact key using dot notation) -> segmentValue. For example: channels.email.address -> userId or icfs.segmentId -> userId',
    type: 'object',
    required: true,
    defaultObjectUI: 'keyvalue'
  }
}
