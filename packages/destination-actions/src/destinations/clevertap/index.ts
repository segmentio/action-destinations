import type {DestinationDefinition} from '@segment/actions-core'
import type {Settings} from './generated-types'

import userUpload from './userUpload'

import userDelete from './userDelete'
import {defaultValues} from "@segment/actions-core";

const destination: DestinationDefinition<Settings> = {
  name: 'Clevertap (Actions)',
  slug: 'actions-clevertap',
  mode: 'cloud',
  description: '<p data-renderer-start-pos="72">CleverTap is a customer engagement and retention platform that provides the functionality to integrate app analytics and marketing. The platform helps customers increase user engagement in three ways:</p>' +
    '<ul class="ak-ul" data-indent-level="1">' +
    '<li><p data-renderer-start-pos="276">Tracks actions users are taking and analyzes how people use the product.</p></li>' +
    '<li><p data-renderer-start-pos="352"><a class="sc-1ko78hw-0 fiVZLH" href="https://docs.clevertap.com/docs/segments" title="https://docs.clevertap.com/docs/segments" data-renderer-mark="true">Segment</a> users based on their actions and run targeted <a class="sc-1ko78hw-0 fiVZLH" href="https://docs.clevertap.com/docs/intro-to-campaigns" title="https://docs.clevertap.com/docs/intro-to-campaigns" data-renderer-mark="true">campaigns</a> to these segments.</p></li>' +
    '<li><p data-renderer-start-pos="438"><a class="sc-1ko78hw-0 fiVZLH" href="https://docs.clevertap.com/docs/intro-to-reports" title="https://docs.clevertap.com/docs/intro-to-reports" data-renderer-mark="true">Analyze</a> each campaign to understand its effect on user engagement and business metrics.</p></li>' +
    '</ul>',
  authentication: {
    scheme: 'custom',
    fields: {
      clevertapAccountId: {
        label: 'CleverTap Account ID',
        description: 'CleverTap Account Id. This can be found under <a href="https://developer.clevertap.com/docs/authentication#getting-your-account-credentials" title="https://developer.clevertap.com/docs/authentication#getting-your-account-credentials">Settings Page</a>.',
        type: 'string',
        required: true
      },
      clevertapPasscode: {
        label: 'CleverTap Account Passcode',
        description: '<p>CleverTap Passcode. This can be found under <a href="https://developer.clevertap.com/docs/authentication#getting-your-account-credentials" title="https://developer.clevertap.com/docs/authentication#getting-your-account-credentials">Settings Page</a>.',
        type: 'string',
        required: true
      },
      clevertapEndpoint: {
        label: 'REST Endpoint',
        description: '<p>Learn More about <a href="https://docs.clevertap.com/docs/build-segment-destination#set-up-segment-destination-action" title="https://docs.clevertap.com/docs/build-segment-destination#set-up-segment-destination-action">Account regions</a>.</p>',
        type: 'string',
        format: 'uri',
        choices: [
          {label: 'SK', value: 'https://sk1.api.clevertap.com'},
          {label: 'EU', value: 'https://eu1.api.clevertap.com'},
          {label: 'US', value: 'https://us1.api.clevertap.com'},
          {label: 'SG', value: 'https://sg1.api.clevertap.com'},
          {label: 'IN', value: 'https://in1.api.clevertap.com'}
        ],
        default: 'https://sk1.api.clevertap.com',
        required: true
      }
    }
  },

  actions: {
    userUpload,
    userDelete
  },
  presets: [
    {
      name: 'Event Name is Delete User',
      subscribe: 'event = "Delete User"',
      partnerAction: 'userDelete',
      mapping: defaultValues(userDelete.fields)
    },
    {
      name: 'Event Type is Identify',
      subscribe: 'type = "identify"',
      partnerAction: 'userUpload',
      mapping: defaultValues(userUpload.fields)
    }
  ],
}

export default destination
