import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import Facebook from '../fbca-client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Reverse ETL',
  description: '',
  fields: {
    method: {
      label: 'Method',
      description: 'The method to use',
      type: 'string',
      required: true,
      choices: [
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' }
      ]
    },
    accountId: {
      label: 'Account ID',
      description: 'The account ID to use',
      type: 'string',
      required: true
    },
    accessToken: {
      label: 'PoC/Testing Only: Access Token',
      description: 'The access token to use',
      type: 'string',
      required: true
    },
    createName: {
      label: 'Create Audience Name',
      description: 'The name to use when creating',
      type: 'string'
    },
    createDescription: {
      label: 'Create Audience Description',
      description: 'The description to use when creating',
      type: 'string'
    },
    updateId: {
      label: 'Update Audience ID',
      description: 'The ID to use when updating',
      type: 'string',
      dynamic: true
    },
    updateSchema: {
      label: 'Update Audience Schema',
      description: 'The schema to use when updating',
      type: 'string',
      // EMAIL_SHA256, PHONE_SHA256, MOBILE_ADVERTISER_ID
      choices: [
        { label: 'Email', value: 'EMAIL_SHA256' },
        { label: 'Phone', value: 'PHONE_SHA256' },
        { label: 'Mobile Advertiser ID', value: 'MOBILE_ADVERTISER_ID' }
      ]
    },
    email: {
      label: 'Email',
      description: 'The email to use when updating',
      type: 'string'
    }
  },
  dynamicFields: {
    updateId: async (request, data) => {
      const fb: Facebook = new Facebook(request, data.payload.accountId, data.payload.accessToken)

      return fb.getAllAudiences()
    }
  },
  perform: (request, { payload }) => {
    const fb: Facebook = new Facebook(request, payload.accountId, payload.accessToken)

    if (payload.method === 'update') {
      return fb.updateAudience(
        payload.updateId ?? 'test',
        payload.updateSchema ?? 'CUSTOM',
        payload.email ?? 'nick@test.com'
      )
    }
  }
}

export default action
