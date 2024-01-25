import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userData, enable_batching, batch_size } from '../rsp-properties'
import { sendProfileListMembersData } from '../rsp-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile List Members',
  description: 'Create or update Profile List Member data',
  fields: {
    profileListName: {
      label: 'List Name',
      description: "Name of the Profile Extension Table's Contact List.",
      type: 'string',
      required: true
    },
    userData: userData,
    mapTemplateName: {
      label: 'Map Template Name',
      description:
        'The Map Template in Responsys that can be used to map Field Names of the Profile List to Column Names.',
      type: 'string',
      default: ''
    },
    insertOnNoMatch: {
      label: 'Insert On No Match',
      description: 'Indicates what should be done for records where a match is not found.',
      type: 'boolean',
      default: true
    },
    matchColumnName1: {
      label: 'First Column Match',
      description: 'First match column for determining whether an insert or update should occur.',
      type: 'string',
      choices: [
        { label: 'RIID', value: 'RIID_' },
        { label: 'CUSTOMER_ID', value: 'CUSTOMER_ID_' },
        { label: 'EMAIL_ADDRESS', value: 'EMAIL_ADDRESS_' },
        { label: 'MOBILE_NUMBER', value: 'MOBILE_NUMBER_' },
        { label: 'EMAIL_MD5_HASH', value: 'EMAIL_MD5_HASH_' },
        { label: 'EMAIL_SHA256_HASH', value: 'EMAIL_SHA256_HASH_' }
      ]
    },
    matchColumnName2: {
      label: 'Second Column Match',
      description: 'Second match column for determining whether an insert or update should occur.',
      type: 'string',
      choices: [
        { label: 'RIID', value: 'RIID_' },
        { label: 'CUSTOMER_ID', value: 'CUSTOMER_ID_' },
        { label: 'EMAIL_ADDRESS', value: 'EMAIL_ADDRESS_' },
        { label: 'MOBILE_NUMBER', value: 'MOBILE_NUMBER_' },
        { label: 'EMAIL_MD5_HASH', value: 'EMAIL_MD5_HASH_' },
        { label: 'EMAIL_SHA256_HASH', value: 'EMAIL_SHA256_HASH_' }
      ]
    },
    updateOnMatch: {
      label: 'Update On Match',
      description: 'Controls how the existing record should be updated.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Replace All', value: 'REPLACE_ALL' },
        { label: 'No Update', value: 'NO_UPDATE' }
      ]
    },
    defaultPermissionStatus: {
      label: 'Default Permission Status',
      description:
        'This value must be specified as either OPTIN or OPTOUT and would be applied to all of the records contained in the API call. If this value is not explicitly specified, then it is set to OPTOUT.',
      type: 'string',
      choices: [
        { label: 'Opt In', value: 'OPTIN' },
        { label: 'Opt Out', value: 'OPTOUT' }
      ],
      default: 'OPTOUT'
    },
    htmlValue: {
      label: 'Preferred Email Format',
      description:
        "Value of incoming preferred email format data. For example, 'H' may represent a preference for HTML formatted email.",
      type: 'string'
    },
    matchOperator: {
      label: 'Match Operator',
      description: 'Operator to join match column names.',
      type: 'string',
      choices: [
        { label: 'None', value: 'NONE' },
        { label: 'And', value: 'AND' }
      ]
    },
    optinValue: {
      label: 'Optin Value',
      description:
        "Value of incoming opt-in status data that represents an opt-in status. For example, 'I' may represent an opt-in status.",
      type: 'string'
    },
    optoutValue: {
      label: 'Optout Value',
      description:
        "Value of incoming opt-out status data that represents an optout status. For example, 'O' may represent an opt-out status.",
      type: 'string'
    },
    rejectRecordIfChannelEmpty: {
      label: 'Reject Record If Channel Empty',
      description:
        'String containing comma-separated channel codes that if specified will result in record rejection when the channel address field is null. See [Responsys API docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-members-post.html)',
      type: 'string',
      default: ''
    },
    textValue: {
      label: 'Text Value',
      description:
        "Value of incoming preferred email format data. For example, 'T' may represent a preference for Text formatted email.",
      type: 'string',
      default: ''
    },
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, { settings, payload }) => {
    return sendProfileListMembersData(request, [payload], settings)
  },

  performBatch: async (request, { settings, payload }) => {
    return sendProfileListMembersData(request, payload, settings)
  }
}

export default action
