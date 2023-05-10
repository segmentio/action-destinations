import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import Facebook, { CreateAudienceParams } from '../fbca-client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Audience',
  description:
    'A utility action which will create an audience in Facebook Ad Manager. This action is not intented to be paired with a subscription.',
  defaultSubscription: "event = 'Never Used. Do not configure a subscription for this action.'",
  fields: {
    accountId: {
      label: 'PoC/Testing Only: Account ID',
      description: 'The account ID to use. Testing Only.',
      type: 'string',
      required: true
    },
    accessToken: {
      label: 'PoC/Testing Only: Access Token',
      description: 'The access token to use. Testing Only.',
      type: 'string',
      required: true
    },
    name: {
      label: 'Audience Name',
      description: 'The name of the audience to create.',
      type: 'string',
      required: true
    },
    description: {
      label: 'Audience Description',
      description: 'The description of the audience to create.',
      type: 'string'
    },
    claimObjective: {
      label: 'Claim Objective',
      description: 'The claim objective of the audience to create.',
      type: 'string',
      choices: [
        { label: 'Automotive Model', value: 'AUTOMOTIVE_MODEL' },
        { label: 'Collaborative Ads', value: 'COLLABORATIVE_ADS' },
        { label: 'Home Listing', value: 'HOME_LISTING' },
        { label: 'Media Title', value: 'MEDIA_TITLE' },
        { label: 'Product', value: 'PRODUCT' },
        { label: 'Travel', value: 'TRAVEL' },
        { label: 'Vehicle', value: 'VEHICLE' },
        { label: 'Vehicle Offer', value: 'VEHICLE_OFFER' }
      ]
    },
    customerFileSource: {
      label: 'Customer File Source',
      description: 'The customer file source of the audience to create.',
      type: 'string',
      choices: [
        { label: 'User Provided Only', value: 'USER_PROVIDED_ONLY' },
        { label: 'Partner Provided Only', value: 'PARTNER_PROVIDED_ONLY' },
        { label: 'Both User and Partner Provided', value: 'BOTH_USER_AND_PARTNER_PROVIDED' }
      ]
    }
  },
  perform: (request, { payload }) => {
    const createAudiencePayload: CreateAudienceParams = {
      name: payload.name,
      description: payload.description,
      claimObjective: payload.claimObjective,
      customerFileSource: payload.customerFileSource
    }

    const fb: Facebook = new Facebook(request, payload.accountId, payload.accessToken)
    return fb.createAudience(createAudiencePayload)
  }
}

export default action
