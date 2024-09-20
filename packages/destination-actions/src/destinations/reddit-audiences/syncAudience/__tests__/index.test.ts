import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import isEqual from 'lodash/isEqual'

const testDestination = createTestIntegration(Definition)
const settings: Settings = {
  ad_account_id: '123456'
}
const mapping = {
  androidIDFA: { '@path': '$.traits.android_idfa' },
  iosIDFA: { '@path': '$.traits.ios_idfa' },
  traits_or_props: { '@path': '$.traits' },
  event_name: { '@path': '$.event' },
  email: { '@path': '$.traits.email' },
  external_audience_id: { '@path': '$.context.personas.external_audience_id' },
  computation_key: { '@path': '$.context.personas.computation_key' },
  segment_computation_action: { '@path': '$.context.personas.computation_class' }
}
const expectedPayloadAdd = {
  data: {
    column_order: ['EMAIL_SHA256', 'MAID_SHA256'],
    user_data: [
      [
        'ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976',
        'ed7bcb5e3573c63a42ac5ccca3a1ef37412e7d6229332493c6caaeeb8f9abccb'
      ]
    ],
    action_type: 'ADD'
  }
}
const segmentEventAdd: Partial<SegmentEvent> = {
  userId: '+254729159373',
  type: 'identify',
  context: {
    personas: {
      external_audience_id: 'ca.2066268373552240021',
      computation_class: 'audience',
      computation_id: 'aud_2mKnduJD6sudXVkAqo0q3qshFTW',
      computation_key: 'test_audience_name'
    }
  },
  traits: {
    email: 'Al.ice+Apple@Example.Com',
    android_idfa: 'test_idfa',
    test_audience_name: true
  }
}
const expectedPayloadRemove = {
  data: {
    column_order: ['EMAIL_SHA256', 'MAID_SHA256'],
    user_data: [
      [
        '42a8e618cba49f19dac88880dc734367f0f1b6d5e729a4af3f860efee0b037d6',
        'ed7bcb5e3573c63a42ac5ccca3a1ef37412e7d6229332493c6caaeeb8f9abccb'
      ]
    ],
    action_type: 'REMOVE'
  }
}
const segmentEventRemove: Partial<SegmentEvent> = {
  userId: '+254729159373',
  type: 'identify',
  context: {
    personas: {
      external_audience_id: 'ca.2066268373552240021',
      computation_class: 'audience',
      computation_id: 'aud_2mKnduJD6sudXVkAqo0q3qshFTW',
      computation_key: 'test_audience_name'
    }
  },
  traits: {
    email: 'testemail234@gmail.com',
    android_idfa: 'test_idfa',
    test_audience_name: false
  }
}
const expectedPayloadEmailOnly = {
  data: {
    column_order: ['EMAIL_SHA256'],
    user_data: [['ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976']],
    action_type: 'ADD'
  }
}
const segmentEventEmailOnly: Partial<SegmentEvent> = {
  userId: '+254729159373',
  type: 'identify',
  context: {
    personas: {
      external_audience_id: 'ca.2066268373552240021',
      computation_class: 'audience',
      computation_id: 'aud_2mKnduJD6sudXVkAqo0q3qshFTW',
      computation_key: 'test_audience_name'
    }
  },
  traits: {
    email: 'Al.ice+Apple@Example.Com',
    test_audience_name: true
  }
}
const expectedPayloadMaidOnly = {
  data: {
    column_order: ['MAID_SHA256'],
    user_data: [['ed7bcb5e3573c63a42ac5ccca3a1ef37412e7d6229332493c6caaeeb8f9abccb']],
    action_type: 'ADD'
  }
}
const segmentEventMaidOnly: Partial<SegmentEvent> = {
  userId: '+254729159373',
  type: 'identify',
  context: {
    personas: {
      external_audience_id: 'ca.2066268373552240021',
      computation_class: 'audience',
      computation_id: 'aud_2mKnduJD6sudXVkAqo0q3qshFTW',
      computation_key: 'test_audience_name'
    }
  },
  traits: {
    android_idfa: 'test_idfa',
    test_audience_name: true
  }
}

describe('Reddit-Audiences.customEvent', () => {
  it('will add a user to an Audience', async () => {
    const event = createTestEvent(segmentEventAdd)

    nock('https://ads-api.reddit.com')
      .matchHeader('Authorization', 'Bearer undefined') // no need to check access_token
      .patch(`/api/v3/custom_audiences/${event?.context?.personas?.external_audience_id}/users`, (body) => {
        return isEqual(body, expectedPayloadAdd)
      })
      .reply(204, {})

    const responses = await testDestination.testAction('syncAudience', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)
  })
  it('will remove a user from an Audience', async () => {
    const event = createTestEvent(segmentEventRemove)

    nock('https://ads-api.reddit.com')
      .matchHeader('Authorization', 'Bearer undefined') // no need to check access_token
      .patch(`/api/v3/custom_audiences/${event?.context?.personas?.external_audience_id}/users`, (body) => {
        return isEqual(body, expectedPayloadRemove)
      })
      .reply(204, {})

    const responses = await testDestination.testAction('syncAudience', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)
  })
  it('will add a user to an Audience with only a present Email', async () => {
    const event = createTestEvent(segmentEventEmailOnly)

    nock('https://ads-api.reddit.com')
      .matchHeader('Authorization', 'Bearer undefined') // no need to check access_token
      .patch(`/api/v3/custom_audiences/${event?.context?.personas?.external_audience_id}/users`, (body) => {
        return isEqual(body, expectedPayloadEmailOnly)
      })
      .reply(204, {})

    const responses = await testDestination.testAction('syncAudience', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)
  })
  it('will add a user to an Audience with only a present MAID', async () => {
    const event = createTestEvent(segmentEventMaidOnly)

    nock('https://ads-api.reddit.com')
      .matchHeader('Authorization', 'Bearer undefined') // no need to check access_token
      .patch(`/api/v3/custom_audiences/${event?.context?.personas?.external_audience_id}/users`, (body) => {
        return isEqual(body, expectedPayloadMaidOnly)
      })
      .reply(204, {})

    const responses = await testDestination.testAction('syncAudience', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)
  })
})
