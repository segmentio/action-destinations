import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, PayloadValidationError } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { RESERVED_HEADERS } from '../constants'
import { parseTemplateId, parseIntFromString, toUnixTS } from '../utils'
import { EU_ENDPOINT } from '../../sendgrid-properties'

let testDestination = createTestIntegration(Definition)

const timestamp = '2024-01-08T13:52:50.212Z'
const settings: Settings = {
  sendGridApiKey: 'test-api-key'
}
const validPayload = {
  timestamp: timestamp,
  event: 'Send Email From Template',
  messageId: 'aaa-bbb-ccc',
  type: 'track',
  userId: 'user_id_1',
  properties: {
    from: {
      email: 'billyjoe@yellowstone.com',
      name: 'Billy Joe'
    },
    to: {
      email: 'maryjane@yellowstone.com',
      name: 'Mary Jane'
    },
    cc: [
      {
        email: 'cc1@gmail.com',
        name: 'CC 1'
      },
      {
        email: 'cc2@gmail.com',
        name: 'CC 2'
      }
    ],
    bcc: [
      {
        email: 'bcc1@gmail.com',
        name: 'BCC 1'
      },
      {
        email: 'bcc2@gmail.com',
        name: 'BCC 2'
      }
    ],
    headers: {
      testHeader1: 'testHeaderValue1'
    },
    dynamic_template_data: {
      stringVal: 'stringVal',
      numVal: 123456,
      boolVal: true,
      objVal: {
        key1: 'value1',
        key2: 'value2'
      },
      arrayVal: ['value1', 'value2']
    },
    template_id: 'd-1234567890',
    custom_args: {
      custom_arg1: 'custom_arg_value1',
      custom_arg2: 'custom_arg_value2'
    },
    reply_to: {
      reply_to_equals_from: true
    },
    categories: ['category1', 'category2'],
    ip_pool_name: 'ip_pool_name1',
    group_id: '123 - blah'
  }
} as Partial<SegmentEvent>
const mapping = {
  from: { '@path': '$.properties.from' },
  to: { '@path': '$.properties.to' },
  cc: { '@path': '$.properties.cc' },
  bcc: { '@path': '$.properties.bcc' },
  headers: { '@path': '$.properties.headers' },
  dynamic_template_data: { '@path': '$.properties.dynamic_template_data' },
  template_id: { '@path': '$.properties.template_id' },
  custom_args: { '@path': '$.properties.custom_args' },
  reply_to: { '@path': '$.properties.reply_to' },
  categories: { '@path': '$.properties.categories' },
  ip_pool_name: { '@path': '$.properties.ip_pool_name' },
  group_id: { '@path': '$.properties.group_id' },
  send_at: { '@path': '$.properties.send_at' }
}
const expectedSendgridPayload = {
  personalizations: [
    {
      to: [
        {
          email: 'maryjane@yellowstone.com',
          name: 'Mary Jane'
        }
      ],
      cc: [
        {
          email: 'cc1@gmail.com',
          name: 'CC 1'
        },
        {
          email: 'cc2@gmail.com',
          name: 'CC 2'
        }
      ],
      bcc: [
        {
          email: 'bcc1@gmail.com',
          name: 'BCC 1'
        },
        {
          email: 'bcc2@gmail.com',
          name: 'BCC 2'
        }
      ],
      headers: {
        testHeader1: 'testHeaderValue1'
      },
      dynamic_template_data: {
        stringVal: 'stringVal',
        numVal: 123456,
        boolVal: true,
        objVal: {
          key1: 'value1',
          key2: 'value2'
        },
        arrayVal: ['value1', 'value2']
      },
      custom_args: {
        custom_arg1: 'custom_arg_value1',
        custom_arg2: 'custom_arg_value2'
      }
    }
  ],
  from: {
    email: 'billyjoe@yellowstone.com',
    name: 'Billy Joe'
  },
  reply_to: {
    email: 'billyjoe@yellowstone.com',
    name: 'Billy Joe'
  },
  template_id: 'd-1234567890',
  categories: ['category1', 'category2'],
  asm: {
    group_id: 123
  },
  ip_pool_name: 'ip_pool_name1'
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Sendgrid.sendEmail', () => {
  it('should send an email', async () => {
    const event = createTestEvent(validPayload)
    // send email via Sendgrid
    nock('https://api.sendgrid.com').post('/v3/mail/send', expectedSendgridPayload).reply(200, {})
    const responses = await testDestination.testAction('sendEmail', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should send an email using EU endpoint', async () => {
    const event = createTestEvent(validPayload)
    const settings = {
      sendGridApiKey: 'test-api-key',
      endpoint: EU_ENDPOINT
    }
    // send email via Sendgrid
    nock(EU_ENDPOINT).post('/v3/mail/send', expectedSendgridPayload).reply(200, {})
    const responses = await testDestination.testAction('sendEmail', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('parse template ID correctly', async () => {
    expect(parseTemplateId('DynamicTemplate1 - Version 2 [d-b8d15722e5144a809c5b0e]')).toBe('d-b8d15722e5144a809c5b0e')
    expect(parseTemplateId('d-b8d15722e5144a809c5b0e Some Other Text')).toBe('d-b8d15722e5144a809c5b0e')
  })

  it('parse group ID correctly', async () => {
    expect(parseIntFromString('blah blah [123456787654]')).toBe(123456787654)
    expect(parseIntFromString('123456787654.234567')).toBe(123456787654)
    expect(parseIntFromString('123456787654')).toBe(123456787654)
    expect(parseIntFromString('')).toBe(undefined)
  })

  it('send_at date should be 10 char epoch', async () => {
    const date = '2024-01-08T13:52:50.212Z'
    const epoch = toUnixTS(date)
    expect(epoch).toBe(1704721970)
  })

  it('should throw error if bad headers', async () => {
    const badPayload = {
      ...validPayload,
      properties: {
        ...validPayload.properties,
        headers: {
          testHeader1: 'testHeaderValue1',
          'dkim-signature': 'baaaad illegal header'
        }
      }
    }
    const event = createTestEvent(badPayload)
    await expect(
      testDestination.testAction('sendEmail', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(
      new PayloadValidationError(
        `Headers cannot contain any of the following reserved headers: ${RESERVED_HEADERS.join(', ')}`
      )
    )
  })

  it('should throw error if bad template ID', async () => {
    const badPayload = { ...validPayload, properties: { ...validPayload.properties, template_id: '1234567890' } }
    const event = createTestEvent(badPayload)
    await expect(
      testDestination.testAction('sendEmail', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(
      new PayloadValidationError(`Template must refer to a Dynamic Template. Dynamic Template IDs start with "d-"`)
    )
  })

  it('should throw error if send_at more than 72h in future', async () => {
    const send_at = new Date(Date.now() + 73 * 60 * 60 * 1000)
    const badPayload = { ...validPayload, properties: { ...validPayload.properties, send_at: send_at.toISOString() } }
    const event = createTestEvent(badPayload)
    await expect(
      testDestination.testAction('sendEmail', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(new PayloadValidationError(`send_at should be less than 72 hours from now`))
  })

  it('should throw error if send_at in the past', async () => {
    const send_at = new Date(Date.now() - 100 * 60 * 60 * 1000)
    const badPayload = { ...validPayload, properties: { ...validPayload.properties, send_at: send_at.toISOString() } }
    const event = createTestEvent(badPayload)
    await expect(
      testDestination.testAction('sendEmail', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(new PayloadValidationError(`send_at should be less than 72 hours from now`))
  })
})
