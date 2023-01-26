import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Record Action',
  description:
    'Based on the action destination configuration, this will record an action to Clickwrap either agreeing, disagreeing, or agreeing to a contract configured in the event.',
  fields: {
    sig: {
      label: 'Signer ID',
      description:
        'The unique identifier used to save your signer’s signature. Can be email, mobile number, UUID, or any integer. Should be URL encoded.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      },
      required: true
    },
    event_name: {
      label: 'Event Name',
      description:
        'The name of the event coming from the source, this is an additional information field before the call goes to Ironclad.',
      type: 'string',
      default: { '@path': '$.event' },
      required: false
    },
    group_id: {
      label: 'Clickwrap Group Id',
      description: 'The ID of the Clickwrap Group associated with the acceptance event. Needs to be an integer',
      type: 'integer',
      required: true
    },
    event_type: {
      label: 'Event Type',
      description: 'The type of event being logged, the available choices are displayed, agreed, and disagreed.',
      type: 'string',
      default: 'displayed',
      required: true,
      choices: [
        { label: 'Displayed', value: 'displayed' },
        { label: 'Agreed', value: 'agreed' },
        { label: 'Disagreed', value: 'disagreed' }
      ]
    },
    contextParameters: {
      type: 'object',
      required: false,
      description: 'Context Parameters including page, time and other information.',
      label: 'Context Parameters',
      default: {
        addr: { '@path': '$.ip' },
        ts: { '@path': '$.timestamp' },
        pat: { '@path': '$.context.page.title' },
        pau: { '@path': '$.context.page.url' },
        pap: { '@path': '$.context.page.path' },
        paq: { '@path': '$.context.page.search' },
        ref: { '@path': '$.context.page.referrer' },
        btz: { '@path': '$.context.timezone' },
        bl: { '@path': '$.context.locale' },
        os: { '@path': '$.context.os.name' },
        res: { '@path': '$.context.screen' }
      }
    },
    customData: {
      type: 'object',
      required: false,
      description:
        'Optional, located in the properties object, used to attach custom data to your Activity. The example is URL encoded for { "first name": "Eric" } Using this in an updated activity will append the data to the signer, otherwise it will be added to the specific activity call/transaction.',
      label: 'Custom Data',
      default: {
        first_name: { '@path': '$.properties.first_name' },
        last_name: { '@path': '$.properties.last_name' },
        company_name: { '@path': '$.properties.company_name' },
        title: { '@path': '$.properties.title' },
        customer_id: { '@path': '$.properties.customer_id' }
      }
    }
  },
  perform: async (request, data) => {
    let ironcladURL = `https://pactsafe.io`

    if (data.settings.staging_endpoint) {
      ironcladURL = `https://staging.pactsafe.io`
    }
    type versions = {
      data?: Object
    }

    const versionURL = `${ironcladURL}/published?sid=${data.settings.sid}&gid=${data.payload.group_id}`

    const versions = await request(versionURL, { method: 'get' })
    const objVersions = versions.data as ObjectConstructor
    const versionCSV = String(Object.values(objVersions))

    const jsonData = {
      sid: data.settings?.sid,
      sig: data.payload?.sig,
      gid: data.payload?.group_id,
      vid: versionCSV,
      ts: data.payload?.contextParameters?.ts,
      pat: data.payload?.contextParameters?.pat,
      pau: data.payload?.contextParameters?.pau,
      pap: data.payload?.contextParameters?.pap,
      paq: data.payload?.contextParameters?.paq,
      ref: data.payload?.contextParameters?.ref,
      btz: data.payload?.contextParameters?.btz,
      bl: data.payload?.contextParameters?.bl,
      os: data.payload?.contextParameters?.os,
      res: data.payload?.contextParameters?.res,
      addr: data.payload?.contextParameters?.addr,
      et: String(data.payload.event_type),
      cus: data.payload.customData,
      server_side: true,
      tm: data.settings.test_mode
    }

    const ironcladEndpoint = await request(ironcladURL + '/send/sync', {
      method: 'POST',
      json: jsonData
    })

    return ironcladEndpoint
  }
}

export default action
