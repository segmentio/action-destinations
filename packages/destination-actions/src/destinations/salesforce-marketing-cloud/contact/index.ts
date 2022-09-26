import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { contactKey, id, key, values, keys } from '../sfmc-properties'
import type { Payload } from './generated-types'
import SalesforceMarketingCloud from '../sfmc-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Create contacts and store their data in a data extension in Salesforce Marketing Cloud.',
  fields: {
    contactKey: { ...contactKey, required: true },
    key: key,
    id: id,
    keys: { ...keys, required: true },
    values: values
  },
  perform: (request, { settings, payload }) => {
    let vals
    if (payload.values) {
      vals = payload.values
    }
    const sfmc: SalesforceMarketingCloud = new SalesforceMarketingCloud(
      settings.subdomain,
      payload.contactKey,
      payload.key,
      payload.id,
      payload.keys,
      vals,
      request
    )
    return sfmc.upsertContact()
    // const contact = {
    //   contactID: payload.contactKey,
    //   attributeSets: []
    // }
    // const requestUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/contacts/v1/contacts`
    // console.log("requestURl:", requestUrl)
    // console.log("contact:", contact)
    // return request(requestUrl, {
    //   method: 'post',
    //   json: {
    //     "contactKey": payload.contactKey,
    //     "attributeSets": []
    //   }
    // })
  }
}

export default action
