import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'
import { SegmentEvent } from '@segment/actions-core'
import createInstance from '@segment/actions-core/src/request-client'

const testDestination = createTestIntegration(destination)
const actionSlug = 'receiveEvents'
const destinationSlug = 'actions-acoustic-campaign-cloud'
const seedName = `${destinationSlug}#${actionSlug}`

const settings = {
  a_pod: '',
  a_region: '',
  a_client_id: '',
  a_client_secret: '',
  a_refresh_token: ''
}

const accessToken = ''

const payloadExample = {
  email: 'jhaltiw99@gmail.com',
  type: 'track',
  timestamp: '2023-02-12T15:07:21.381Z',
  context: {
    integration: {
      name: 'shopify_littledata',
      version: '9.1'
    },
    library: {
      name: 'analytics-node',
      version: '3.5.0'
    },
    traits: {
      address: {
        city: 'greenville',
        country: 'us',
        postalCode: '29609',
        state: 'sc'
      },
      email: 'jhaltiw@gmail.com',
      firstName: 'james',
      lastName: 'haltiwanger'
    }
  },
  properties: {
    email: 'jhaltiw@gmail.com',
    action_source: 'system_generated',
    cart_id: 'fff7b1597270349875cffad3852067ab',
    category: 'Shopify (Littledata)',
    checkout_id: 26976972210285,
    coupon: 'HONEY15',
    currency: 'USD',
    discount: 4.79,
    presentment_amount: '31.98',
    presentment_currency: 'USD',
    price: 31.98,
    products: [
      {
        brand: 'Pura',
        category: 'Fragrance',
        image_url: 'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/SimplyLavender_Prod_1.jpg?v=1649347142',
        name: 'Simply Lavender',
        presentment_amount: '12.99',
        presentment_currency: 'USD',
        price: 12.99,
        product_id: '1542783500397',
        quantity: 1,
        shopify_product_id: '1542783500397',
        shopify_variant_id: '14369408221293',
        sku: 'NGL',
        url: 'https://pura-scents.myshopify.com/products/simply-lavender',
        variant: 'Simply Lavender'
      },
      {
        brand: 'NEST New York',
        category: 'Fragrance',
        image_url: 'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/Grapefruit_Prod_1.jpg?v=1649344617',
        name: 'Grapefruit',
        presentment_amount: '18.99',
        presentment_currency: 'USD',
        price: 18.99,
        product_id: '3979374755949',
        quantity: 1,
        shopify_product_id: '3979374755949',
        shopify_variant_id: '29660017000557',
        sku: 'MXV',
        url: 'https://pura-scents.myshopify.com/products/grapefruit',
        variant: 'Grapefruit'
      }
    ],
    sent_from: 'Littledata app',
    shipping_method: 'Standard Shipping (5-7 days)',
    source_name: 'web',
    step: 2
  }
} as SegmentEvent

const payload = createTestEvent(payloadExample)

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const actions = destination.actions[actionSlug]

    //const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    const [eventData, settingsData] = generateTestData(seedName, destination, actions, true)
    console.log('Required Fields test\n' + eventData)

    // nock(/.*/).persist().get(/.*/).reply(200)
    // nock(/.*/).persist().post(/.*/).reply(200)
    // nock(/.*/).persist().put(/.*/).reply(200)

    nock.recorder.rec()
    nock.back.setMode('record')

    const xmlAPICalls = nock(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com`, {
      reqheaders: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/xml',
        'user-agent': 'Segment (checkforRT)',
        Connection: 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: '*/*'
      }
    })
      .persist()
      .post('/XMLAPI') //, body => body.username && body.password
      .reply(200, {})

    xmlAPICalls.isDone

    const request = createInstance()

    expect(actions.perform(request, { settings, payload })).toMatchSnapshot()

    expect(actions.perform).toHaveBeenCalled()

    expect(destination.actions.receiveEvents.perform).toHaveBeenCalled()

    const responses = await testDestination.testAction(actionSlug, {
      //event: event,
      event: payload,
      settings: settingsData,
      auth: undefined,
      useDefaultMappings: true
    })

    const req = responses[0].request
    const rawBody = await req.text()

    //const json = JSON.parse(rawBody)

    expect(rawBody).toContain('<SUCCESS>true</SUCCESS>')
    expect(req.headers).toMatchSnapshot()
    expect(rawBody).toMatchSnapshot()
  })

  it('all fields', async () => {
    const actions = destination.actions[actionSlug]

    //const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    console.log('All Fields test\n' + eventData)

    //nock(/.*/).persist().get(/.*/).reply(200)
    //nock(/.*/).persist().post(/.*/).reply(200)
    //nock(/.*/).persist().put(/.*/).reply(200)

    // const event = createTestEvent({
    //   properties: eventData
    // })

    nock.recorder.rec()
    nock.back.setMode('record')

    const xmlAPICalls = nock(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com`, {
      reqheaders: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/xml',
        'user-agent': 'Segment (checkforRT)',
        Connection: 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: '*/*'
      }
    })
      .persist()
      .post('/XMLAPI') //, body => body.username && body.password
      .reply(200, {})

    xmlAPICalls.isDone

    const request = createInstance()

    expect(actions.perform(request, { settings, payload })).toMatchSnapshot()

    expect(actions.perform).toHaveBeenCalled()

    expect(destination.actions.receiveEvents.perform).toHaveBeenCalled()

    const responses = await testDestination.testAction(actionSlug, {
      //event: event,
      event: payload,
      useDefaultMappings: true,
      settings: settingsData,
      auth: undefined
    })

    const req = responses[0].request
    const rawBody = await req.text()

    // const json = JSON.parse(rawBody)
    // expect(json).toMatchSnapshot()

    expect(rawBody).toContain('<SUCCESS>true</SUCCESS>')
    expect(req.headers).toMatchSnapshot()
    expect(rawBody).toMatchSnapshot()
  })
})
