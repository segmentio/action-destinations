import { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { Payload } from 'src/attach.types'
import { Settings } from 'src/generated-types'
import Rupt from 'src/types'

const attach: BrowserActionDefinition<Settings, Rupt, Payload> = {
  title: 'Attach Device',
  description: 'Attach a device to an account.',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {
    account: {
      description: 'The account to attach the device to.',
      label: 'Account',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      description: 'The email of the user to attach the device to.',
      label: 'Email',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.email' }
        }
      }
    },
    phone: {
      description: 'The phone number of the user to attach the device to.',
      label: 'Phone',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    metadata: {
      description: 'Metadata to attach to the device.',
      label: 'Metadata',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue'
    },
    include_page: {
      description: 'Whether to include the page (url) in the attach request',
      label: 'Include Page',
      type: 'boolean',
      required: false
    }
  },
  perform(rupt, data) {
    console.log('attach', data)

    rupt.attach({
      client_id: data.settings.client_id,
      account: data.payload.account,
      email: data.payload.email,
      phone: data.payload.phone,
      metadata: data.payload.metadata,
      include_page: data.payload.include_page,
      redirect_urls: {
        new_account_url: data.settings.new_account_url,
        success_url: data.settings.success_url,
        suspended_url: data.settings.suspended_url,
        logout_url: data.settings.logout_url
      }
    })
  }
}

export default attach
