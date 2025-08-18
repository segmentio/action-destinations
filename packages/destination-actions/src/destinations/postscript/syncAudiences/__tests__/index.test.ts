import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { PS_BASE_URL } from '../../const'

const DUMMY_PHONE = '+15555555555'
const DUMMY_EMAIL = 'test@email.com'
const DUMMY_ID = 42

const testDestination = createTestIntegration(Destination)

const trackEventWithEmail = createTestEvent({
  type: 'track',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ps_segment_test',
      computation_id: 'ps_segment_audience_id'
    },
    traits: {
      email: DUMMY_EMAIL
    }
  },
  properties: {
    audience_key: 'ps_segment_test',
    ps_segment_test: true
  }
})

const trackEventWithPhone = createTestEvent({
  type: 'track',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ps_segment_test',
      computation_id: 'ps_segment_audience_id'
    },
    traits: {
      phone: DUMMY_PHONE
    }
  },
  properties: {
    audience_key: 'ps_segment_test',
    ps_segment_test: true
  }
})

const trackEventWithBoth = createTestEvent({
  type: 'track',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ps_segment_test',
      computation_id: 'ps_segment_audience_id'
    },
    traits: {
      phone: DUMMY_PHONE,
      email: DUMMY_EMAIL
    }
  },
  properties: {
    audience_key: 'ps_segment_test',
    ps_segment_test: true
  }
})

const trackEventMissingBoth = createTestEvent({
  type: 'track',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ps_segment_test',
      computation_id: 'ps_segment_audience_id'
    }
  },
  properties: {
    audience_key: 'ps_segment_test',
    ps_segment_test: true
  }
})

const identifyEventWithEmail = createTestEvent({
  type: 'identify',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ps_segment_test',
      computation_id: 'ps_segment_audience_id'
    }
  },
  traits: {
    audience_key: 'ps_segment_test',
    ld_segment_test: true,
    email: DUMMY_EMAIL
  }
})

const identifyEventWithPhone = createTestEvent({
  type: 'identify',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ps_segment_test',
      computation_id: 'ps_segment_audience_id'
    }
  },
  traits: {
    audience_key: 'ps_segment_test',
    ld_segment_test: true,
    phone: DUMMY_PHONE
  }
})

const identifyEventWithBoth = createTestEvent({
  type: 'identify',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ps_segment_test',
      computation_id: 'ps_segment_audience_id'
    }
  },
  traits: {
    audience_key: 'ps_segment_test',
    ld_segment_test: true,
    phone: DUMMY_PHONE,
    email: DUMMY_EMAIL
  }
})

const identifyEventMissingBoth = createTestEvent({
  type: 'identify',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ps_segment_test',
      computation_id: 'ps_segment_audience_id'
    }
  },
  traits: {
    audience_key: 'ps_segment_test',
    ld_segment_test: true
  }
})

const dummySubscriberGetResponse = {
  subscribers: [
    {
      id: DUMMY_ID,
      properties: {
        custom_property: 'value'
      }
    }
  ]
}

function setupNock() {
  nock(PS_BASE_URL)
    .patch('/api/v2/subscribers/' + DUMMY_ID)
    .reply(200)
  nock(PS_BASE_URL)
    .get('/api/v2/subscribers')
    .query({ phone_number__eq: DUMMY_PHONE.replace('+', '') })
    .reply(200, dummySubscriberGetResponse)
  nock(PS_BASE_URL).get('/api/v2/subscribers').query({ email__eq: DUMMY_EMAIL }).reply(200, dummySubscriberGetResponse)
  nock(PS_BASE_URL).post('/api/v2/events').reply(200)
}

describe('Postscript.syncAudiences', () => {
  it('should update audience - email only - track', async () => {
    setupNock()

    await expect(
      testDestination.testAction('syncAudiences', {
        event: trackEventWithEmail,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should update audience - phone only - track', async () => {
    setupNock()

    await expect(
      testDestination.testAction('syncAudiences', {
        event: trackEventWithPhone,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should update audience - both phone and email - track', async () => {
    setupNock()

    await expect(
      testDestination.testAction('syncAudiences', {
        event: trackEventWithBoth,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should update audience - email only - identify', async () => {
    setupNock()

    await expect(
      testDestination.testAction('syncAudiences', {
        event: identifyEventWithEmail,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should update audience - phone only - identify', async () => {
    setupNock()

    await expect(
      testDestination.testAction('syncAudiences', {
        event: identifyEventWithPhone,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should update audience - both phone and email - identify', async () => {
    setupNock()

    await expect(
      testDestination.testAction('syncAudiences', {
        event: identifyEventWithBoth,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should fail to update audience - missing both phone and email - track', async () => {
    await expect(
      testDestination.testAction('syncAudiences', {
        event: trackEventMissingBoth,
        useDefaultMappings: true
      })
    ).rejects.toThrowError()
  })

  it('should fail to update audience - missing both phone and email - identify', async () => {
    await expect(
      testDestination.testAction('syncAudiences', {
        event: identifyEventMissingBoth,
        useDefaultMappings: true
      })
    ).rejects.toThrowError()
  })
})
