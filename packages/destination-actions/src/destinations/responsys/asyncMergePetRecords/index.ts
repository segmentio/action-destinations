import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userData, enable_batching, batch_size } from '../rsp-properties'
import { sendPETData } from '../rsp-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert to Profile Extension Table',
  description: 'Create or update data in Profile Extension Table records.',
  defaultSubscription: 'type = "identify"',
  fields: {
    profileListName: {
      label: 'List Name',
      description: "Name of the Profile Extension Table's Contact List.",
      type: 'string',
      required: true
    },
    profileExtensionTable: {
      label: 'PET Name',
      description: 'Profile Extension Table (PET) Name',
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
        { label: 'RIID', value: 'RIID' },
        { label: 'CUSTOMER_ID', value: 'CUSTOMER_ID' },
        { label: 'EMAIL_ADDRESS', value: 'EMAIL_ADDRESS' },
        { label: 'MOBILE_NUMBER', value: 'MOBILE_NUMBER' },
        { label: 'EMAIL_MD5_HASH', value: 'EMAIL_MD5_HASH' },
        { label: 'EMAIL_SHA256_HASH', value: 'EMAIL_SHA256_HASH' }
      ]
    },
    matchColumnName2: {
      label: 'Second Column Match',
      description: 'Second match column for determining whether an insert or update should occur.',
      type: 'string',
      choices: [
        { label: 'RIID', value: 'RIID' },
        { label: 'CUSTOMER_ID', value: 'CUSTOMER_ID' },
        { label: 'EMAIL_ADDRESS', value: 'EMAIL_ADDRESS' },
        { label: 'MOBILE_NUMBER', value: 'MOBILE_NUMBER' },
        { label: 'EMAIL_MD5_HASH', value: 'EMAIL_MD5_HASH' },
        { label: 'EMAIL_SHA256_HASH', value: 'EMAIL_SHA256_HASH' }
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
    enable_batching: enable_batching,
    batch_size: batch_size
  },

  perform: async (request, { settings, payload }) => {
    return sendPETData(request, [payload], settings)
  },

  performBatch: async (request, { settings, payload }) => {
    return sendPETData(request, payload, settings)
  }
}

export default action
