import type { ActionDefinition } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_oauth1_signature, gen_segment_subtaxonomy_payload } from '../utils-tax'
/* Generates a Segment in Yahoo Taxonomy */

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create SEGMENT sub-node in Yahoo taxonomy',
  description: 'Use this action to generate SEGMENT sub-node within CUSTOMER node in Yahoo taxonomy',
  defaultSubscription: 'event = "Audience Entered" and event = "Audience Exited"',

  fields: {
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Provide audience key. This maps to the "Name" of the Segment node in Yahoo taxonomy',
      type: 'string',
      required: true
    },
    segment_audience_id: {
      label: 'Audience Id',
      description:
        'Provide audience Id (aud_...) from audience URL in Segment Engage. This maps to the "Id" of the Segment node in Yahoo taxonomy',
      type: 'string',
      required: true
    },
    engage_space_id: {
      label: 'Engage Space Id',
      description:
        'Provide Engage Space Id found in Unify > Settings > API Access. This maps to the "Id" and "Name" of the top-level Customer node in Yahoo taxonomy and specifies the parent node for your Segment node in Yahoo taxonomy',
      type: 'string',
      required: false
    },
    customer_desc: {
      label: 'Space Description',
      description: 'Provide the description for Segment node in Yahoo taxonomy. This must be less then 1000 characters',
      type: 'string',
      required: false
    }
  },
  perform: async (request, { payload, auth }) => {
    // const tk = {
    //   tx_client_secret: 'abc',
    //   tx_client_key:'123'
    // }
    if (auth?.accessToken) {
      // if (tk) {
      const creds = Buffer.from(auth.accessToken, 'base64').toString()
      const creds_json = JSON.parse(creds)
      const tx_pair = creds_json.tx
      console.log(tx_pair)
      // const tx_pair = tk;
      return update_taxonomy(tx_pair, request, payload)
    }
  }
}
interface CredsObj {
  tx_client_key: string
  tx_client_secret: string
}

async function update_taxonomy(tx_creds: CredsObj, request: RequestClient, payload: Payload) {
  const tx_client_secret = tx_creds.tx_client_key
  const tx_client_key = tx_creds.tx_client_secret

  console.log('createSegment > update_taxonomy')
  const url = `https://datax.yahooapis.com/v1/taxonomy/append/${payload.engage_space_id}`
  const oauth1_auth_string = gen_oauth1_signature(tx_client_key, tx_client_secret, 'PUT', url)
  console.log('oauth1_auth_string:', oauth1_auth_string)
  const body_form_data = gen_segment_subtaxonomy_payload(payload)
  console.log(body_form_data)
  const add_segment_node = await request(url, {
    method: 'PUT',
    body: body_form_data,
    headers: {
      Authorization: oauth1_auth_string,
      'Content-Type': 'multipart/form-data; boundary=SEGMENT-DATA'
    }
  })
  const segment_node_json = await add_segment_node.json()
  console.log('createSegment resp:', JSON.stringify(segment_node_json))
  // 'GET taxonomy' endpoint should not be used, because it doesn't consistently return the complete taxonomy
  /*
  const taxonomy_req = await yahooTaxonomyApiClient.get_taxonomy(client_key, client_secret)
  const taxonomy_arr: Array<TaxonomyObject> = await taxonomy_req.json()

  // If taxonomy is empty - create customer forder and audience subfolder
  if (taxonomy_arr.length == 0) {
    await create_customer_taxonomy(client_key, client_secret,yahooTaxonomyApiClient, settings, payload)
    await create_segment_taxonomy(client_key, client_secret,yahooTaxonomyApiClient, settings, payload)
  }

  // If taxonomy doesn't include customer folder - create customer forder and audience subfolder
  // Locate customer folder

  const customer_folder_index: number = taxonomy_arr.findIndex(
    (customer_obj) => customer_obj.id == payload.engage_space_id
  )

  if (customer_folder_index < 0) {
    const customer_taxonomy = await create_customer_taxonomy(client_key, client_secret,yahooTaxonomyApiClient, settings, payload)
    if (customer_taxonomy?.status !== 200) {
      throw new RetryableError(`Retrying the attempt to create customer taxonomy`)
    }
    const segment_taxonomy = await create_segment_taxonomy(client_key, client_secret,yahooTaxonomyApiClient, settings, payload)
    if (segment_taxonomy?.status !== 200) {
      throw new RetryableError(`Retrying the attempt to create segment taxonomy`)
    }
    return segment_taxonomy
  } else {
    // If customer folder exists - check if audience folder exists, if not - create it
    if (
      taxonomy_arr[customer_folder_index].subTaxonomy.findIndex(
        (segment_obj: { id: string }) => segment_obj.id == payload.segment_audience_id
      ) < 0
    ) {
      const segment_taxonomy = await create_segment_taxonomy(client_key, client_secret,yahooTaxonomyApiClient, settings, payload)
      if (segment_taxonomy?.status !== 200) {
        throw new RetryableError(`Retrying the attempt to create segment taxonomy`)
      }
      return segment_taxonomy
    }
  }
  */
}

export default action
