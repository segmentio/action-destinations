import { validateInput } from '../validateInput'

const fakeTrackData = {
  event_id: 'test-message-cz380xxe9kn',
  page_title: 'Title',
  event_name: 'test',
  event_type: 'track',
  properties: {
    required: 'false'
  },
  timestamp: '2023-09-11T08:06:11.192Z',
  user_id: 'test',
  account_id: 'testAccount'
}

const fakeIdentifyData = {
  event_id: 'test-message-cz380xxe9kn',
  page_title: 'Title',
  event_name: 'test',
  event_type: 'identify',
  name: 'testUser',
  email: 'testEmail',
  traits: {
    required: 'false'
  },
  timestamp: '2023-09-11T08:06:11.192Z',
  user_id: 'test',
  account_id: 'testAccount'
}

const fakeGroupData = {
  event_id: 'test-message-cz380xxe9kn',
  page_title: 'Title',
  event_name: 'test',
  event_type: 'group',
  name: 'Test account',
  plan: 'temporary',
  industry: 'test industry',
  website: 'test website',
  traits: {
    required: 'false'
  },
  timestamp: '2023-09-11T08:06:11.192Z',
  user_id: 'test',
  account_id: 'testAccount'
}

const settings = {
  workspaceIdentifier: 'testWorkspaceId',
  apiKey: 'testApiKey'
}

describe('validateInput', () => {
  describe('test common payload', () => {
    it('should return converted payload', () => {
      const payload = validateInput(settings, fakeIdentifyData, 'user_identify')
      expect(payload.api_key).toBe(settings.apiKey)
      expect(payload.workspace_key).toBe(settings.workspaceIdentifier)
      expect(payload.doc_encoding).toBe('UTF-8')
      expect(payload.src).toBe('segment_api')
    })
  })

  describe('test identify payload', () => {
    it('should return converted payload', async () => {
      const payload = validateInput(settings, fakeIdentifyData, 'user_identify')
      expect(payload.user_id).toEqual(fakeIdentifyData.user_id)
      expect(payload.traits.email).toEqual(fakeIdentifyData.email)
      expect(payload.traits.name).toEqual(fakeIdentifyData.name)
      expect(payload.traits).toHaveProperty('required')
    })
  })

  describe('test group payload', () => {
    it('should return converted payload', async () => {
      const payload = validateInput(settings, fakeGroupData, 'account_identify')
      expect(payload.account_id).toEqual(fakeGroupData.account_id)
      expect(payload.traits.plan_name).toEqual(fakeGroupData.plan)
      expect(payload.traits.industry).toEqual(fakeGroupData.industry)
      expect(payload.traits.website).toEqual(fakeGroupData.website)
      expect(payload.traits).toHaveProperty('required')
    })
  })

  describe('test track payload', () => {
    it('should return converted payload', async () => {
      let payload = validateInput(settings, fakeGroupData, 'account_identify')
      expect(payload.event_type).toEqual('account_identify')
      payload = validateInput(settings, fakeTrackData, 'track')
      expect(payload.event_type).toEqual('test')
    })
  })
})
