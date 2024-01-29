import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enable_batching, batch_size } from '../rsp-properties'
import { sendPETData } from '../rsp-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert to Profile Extension Table',
  description: 'Sync Custom Traits to  Profile Extension Table records.',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    /*
     *  Scope: Connection + Engage Global scoped field
     */
    profileListName: {   
      label: 'List Name',
      description: "Name of the Profile Extension Table's Contact List.",
      type: 'string',
      required: true
    },
    /*
     *  Scope: Connection + Engage Audience scoped field
     *  Purpose: Indicates which 'table' in Responsys to send non standard traits from userData / Recepient Data field
     */
    profileExtensionTable: {  
      label: 'PET Name',
      description: 'Profile Extension Table (PET) Name',
      type: 'string',
      required: true
    },
    email: {  
      label: 'Email address', 
      description: "The user's email address",
      type: 'string',
      format: 'email',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    customer_id: {  
      label: 'Customer ID', 
      description: "Responsys Customer ID.",
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    /*
     *  Scope: Connection + Engage Global scoped field
     */
    engage_audience_key: {  
      label: 'Engage Audience Key', 
      description: "The Engage Audience's Key. This field is only used when syncing a Engage Audience to Responsys.",
      type: 'string',
      required: false,
      default: { '@path': '$.context.personas.computation_key' }
    },
    /*
     *  Scope: Connection + Engage Audience scoped field
     *  Purpose: 
     *   - non standard traits. 
     */
    userData: {  
      label: 'Recepient Data', 
      description: 'Record data that represents Field Names and corresponding values for the recipient.',
      type: 'object',
      defaultObjectUI: 'keyvalue:only',
      required: false
    },
    properties_or_traits: {  
      label: 'Properties or traits field', 
      description: "Hidden field: Used to capture Audience value from properties or traits",
      type: 'object',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      },
      unsafe_hidden: true
    },
    /*
     *  Scope: Not requred for Segment Destination. Will pass an empty string always. 
     */ 
    mapTemplateName: {
      label: 'Map Template Name',
      description:
        'Not needed for Segment Destination, thus hidden: The Map Template in Responsys that can be used to map Field Names of the Profile List to Column Names.',
      type: 'string',
      default: '',
      required: true,
      unsafe_hidden: true
    },
    /*
     *  Scope: Connection + Engage Global scoped field
     */ 
    insertOnNoMatch: {
      label: 'Insert On No Match',
      description: 'Indicates what should be done for records where a match is not found.',
      type: 'boolean',
      default: true, 
      required: true
    },
    /*
     *  Scope: Connection + Engage Global scoped field
     */ 
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
      ], 
      default: 'EMAIL_ADDRESS',
      required: true
    },
    /*
     *  Scope: Connection + Engage Global scoped field
     */ 
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
    /*
     *  Scope: Connection + Engage Global scoped field
     */ 
    updateOnMatch: {
      label: 'Update On Match',
      description: 'Controls how the existing record should be updated. Defaults to Replace All.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Replace All', value: 'REPLACE_ALL' },
        { label: 'No Update', value: 'NO_UPDATE' }
      ], 
      default: 'REPLACE_ALL'
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
