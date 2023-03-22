import { parseSections, addUpdateEvents } from '../eventprocessing'

jest.mock('@segment/actions-core')
jest.mock('lodash/flatten')
jest.mock('lodash/get')
jest.mock('../../generated-types')
jest.mock('../../receiveEvents/generated-types')
jest.mock('../tablemaintutilities')

describe('parseSections', () => {
  it('parseSections should be present', () => {
    //const parseResults: { [key: string]: string } = {}
    expect(parseSections).toBeDefined()
  })

  it('parseSections should return a complete, non-empty KV result', () => {
    //const parseResults: { [key: string]: string } = {}

    const section = {
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
    } as object as { [key: string]: string }

    const outcome = {
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
      'products.0.brand': 'Pura',
      'products.0.category': 'Fragrance',
      'products.0.image_url':
        'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/SimplyLavender_Prod_1.jpg?v=1649347142',
      'products.0.name': 'Simply Lavender',
      'products.0.presentment_amount': '12.99',
      'products.0.presentment_currency': 'USD',
      'products.0.price': 12.99,
      'products.0.product_id': '1542783500397',
      'products.0.quantity': 1,
      'products.0.shopify_product_id': '1542783500397',
      'products.0.shopify_variant_id': '14369408221293',
      'products.0.sku': 'NGL',
      'products.0.url': 'https://pura-scents.myshopify.com/products/simply-lavender',
      'products.0.variant': 'Simply Lavender',
      'products.1.brand': 'NEST New York',
      'products.1.category': 'Fragrance',
      'products.1.image_url':
        'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/Grapefruit_Prod_1.jpg?v=1649344617',
      'products.1.name': 'Grapefruit',
      'products.1.presentment_amount': '18.99',
      'products.1.presentment_currency': 'USD',
      'products.1.price': 18.99,
      'products.1.product_id': '3979374755949',
      'products.1.quantity': 1,
      'products.1.shopify_product_id': '3979374755949',
      'products.1.shopify_variant_id': '29660017000557',
      'products.1.sku': 'MXV',
      'products.1.url': 'https://pura-scents.myshopify.com/products/grapefruit',
      'products.1.variant': 'Grapefruit',
      sent_from: 'Littledata app',
      shipping_method: 'Standard Shipping (5-7 days)',
      source_name: 'web',
      step: 2
    }

    expect(parseSections(section, 0)).toEqual(outcome)
  })

  it('parseSections should match correct outcome', () => {
    //const parseResults: { [key: string]: string } = {}

    const section = {
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
    } as object as { [key: string]: string }

    expect(parseSections(section, 0)).toMatchSnapshot()
  })
})

describe('addUpdateEvents', () => {
  it('should be present', () => {
    expect(addUpdateEvents).toBeDefined()
  })

  it('addUpdateEvents should return expected output', async () => {
    // const retValue = await addUpdateEvents(request,payload,settings,auth,email);

    const payload = {
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
            image_url:
              'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/SimplyLavender_Prod_1.jpg?v=1649347142',
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
    }

    // const outcome = `
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[email]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[action_source]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[system_generated]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[cart_id]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[fff7b1597270349875cffad3852067ab]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[category]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[Shopify (Littledata)]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[checkout_id]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[26976972210285]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[coupon]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[HONEY15]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[currency]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[USD]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[discount]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[4.79]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[presentment_amount]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[31.98]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[presentment_currency]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[USD]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[price]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[31.98]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.brand]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[Pura]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.category]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[Fragrance]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.image_url]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[https://cdn.shopify.com/s/files/1/0023/0021/5405/products/SimplyLavender_Prod_1.jpg?v=1649347142]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.name]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[Simply Lavender]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.presentment_amount]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[12.99]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.presentment_currency]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[USD]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.price]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[12.99]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.product_id]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[1542783500397]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.quantity]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[1]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.shopify_product_id]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[1542783500397]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.shopify_variant_id]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[14369408221293]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.sku]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[NGL]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.url]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[https://pura-scents.myshopify.com/products/simply-lavender]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.0.variant]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[Simply Lavender]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.brand]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[NEST New York]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.category]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[Fragrance]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.image_url]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[https://cdn.shopify.com/s/files/1/0023/0021/5405/products/Grapefruit_Prod_1.jpg?v=1649344617]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.name]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[Grapefruit]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.presentment_amount]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[18.99]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.presentment_currency]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[USD]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.price]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[18.99]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.product_id]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[3979374755949]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.quantity]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[1]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.shopify_product_id]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[3979374755949]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.shopify_variant_id]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[29660017000557]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.sku]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[MXV]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.url]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[https://pura-scents.myshopify.com/products/grapefruit]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[products.1.variant]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[Grapefruit]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[sent_from]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[Littledata app]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[shipping_method]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[Standard Shipping (5-7 days)]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[source_name]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[web]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[step]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[2]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[integration.name]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[shopify_littledata]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[integration.version]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[9.1]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[library.name]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[analytics-node]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[library.version]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[3.5.0]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[traits.address.city]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[greenville]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[traits.address.country]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[us]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[traits.address.postalCode]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[29609]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[traits.address.state]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[sc]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[traits.email]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[traits.firstName]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[james]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // <ROW>
    // <COLUMN name=\"Email\">           <![CDATA[jhaltiw@gmail.com]]></COLUMN>
    // <COLUMN name=\"EventSource\">     <![CDATA[undefined Event]]></COLUMN>··
    // <COLUMN name=\"EventName\">       <![CDATA[traits.lastName]]></COLUMN>
    // <COLUMN name=\"EventValue\">      <![CDATA[haltiwanger]]></COLUMN>
    // <COLUMN name=\"Event Timestamp\"> <![CDATA[undefined]]></COLUMN>
    // </ROW>
    // `

    expect(addUpdateEvents(payload, 'jhaltiw@gmail.com')).toMatchSnapshot()
  })
})
