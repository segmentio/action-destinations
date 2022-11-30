import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'View Contract',
  description: '',
  fields: {
    sig: {
      label: 'Signer ID',
      description:
        'The unique identifier used to save your signer’s signature. Can be email, mobile number, UUID, or any integer. Should be URL encoded',
      type: 'string',
      default: { '@path': 'userId' },
      required: true
    },
    event_name: {
      label: 'Event Name',
      description:
        'The name of the event coming from the source, this will get translated into the Group Key and event type before the call goes to Ironclad',
      type: 'string',
      default: { '@path': 'event' },
      required: true
    },
    group_key: {
      label: 'Group Key',
      description: 'The Key of the Group associated with the acceptance event',
      type: 'string',
      default: 'sign-up',
      required: true
    },
    event_type: {
      label: 'Event Type',
      description:
        ' The type of event being logged. Default values are displayed, updated, agreed, visited, sent, and disagreed',
      type: 'string',
      default: 'visited',
      required: true,
      multiple: true,
      choices: [
        { label: 'Displayed', value: 'displayed' },
        { label: 'Updated', value: 'updated' },
        { label: 'Agreed', value: 'agreed' },
        { label: 'Visited', value: 'visited' },
        { label: 'Sent', value: 'sent' },
        { label: 'Disagreed', value: 'disagreed' }
      ]
    }
  },
  perform: async (request, data) => {
    console.log('data: ', data.payload)

    const versionURL = `https://staging.pactsafe.io/published?sid=${data.settings.sid}&gkey=${data.payload.group_key}`

    console.log('======> versionURL: ', versionURL)

    type versions = {
      data?: Object
    }

    let objVersions = Object

    const versions = await request(versionURL, { method: 'get' })
    objVersions = versions.data as any
    const versionCSV = String(Object.values(objVersions))

    // console.log('======> versionCSV: ', versionCSV);

    //TODO: Move this to configuration
    const ironcladURL = `https://staging.pactsafe.io/send`
    const jsonData = {
      sid: data.settings.sid,
      sig: data.payload.sig,
      vid: versionCSV,
      et: String(data.payload.event_type),
      server_side: true,
      tm: true
    }
    // console.log('======> jsonData: ', jsonData);
    const ironcladEndpoint = await request(ironcladURL, {
      method: 'POST',
      json: jsonData
    })

    // console.log('======> ironcladEndpoint: ', ironcladEndpoint);

    return ironcladEndpoint

    // console.log('======> pipedream: ', pipedream);

    // if (data.payload !== undefined) {
    // try {
    //   Object.entries(versionsArr).forEach(async ([vkey, vid]) => {
    //     Object.entries(data.payload.event_type).forEach(async ([key, et]) => {
    //       console.log('======> Event Type: ', et);
    //       const ironcladURL = `https://staging.pactsafe.io/send`
    //       console.log('======> DEBUG: ', ironcladURL);
    //       const ironcladEndpoint = await request(ironcladURL, {
    //         method: 'post',
    //         json: {
    //           sid: data.settings.sid,
    //           sig: data.settings.sig,
    //           vid: data.settings.vid,
    //           et: data.settings.et,
    //           server_side: true,
    //           tm: true
    //         }
    //       })
    //       console.log('======> ironcladEndpoint: ', ironcladEndpoint);
    //       return { status: 'OK' }
    //     })
    //   })
    //   return { status: 'OK' }
    // } catch (error) {
    //   console.log('======> error: ', error);
    // }

    // }
  }
}

export default action
