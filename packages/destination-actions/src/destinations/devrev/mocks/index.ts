import { createTestEvent, SegmentEvent } from '@segment/actions-core'
import * as types from '../utils/types'

export const tagsResponse: types.TagsResponse = {
  data: {
    next_cursor: '',
    tags: [
      {
        id: 'don:core:dvrv-us-1:devo/g0NHWj3i:tag/2',
        name: 'test-tag'
      }
    ]
  }
}

export const accountsListResponse: types.AccountListResponse = {
  data: {
    next_cursor: '',
    accounts: [
      {
        id: 'don:identity:dvrv-us-1:devo/g0NHWj3i:account/cDQcoK9u',
        created_date: '2023-06-02T09:17:21.714Z',
        display_name: 'test-dev',
        state: 'active'
      },
      {
        id: 'don:identity:dvrv-us-1:devo/g0NHWj3i:account/jllQLGB2',
        created_date: '2023-06-02T09:17:21.681Z',
        display_name: 'Demo',
        domains: ['test.com'],
        state: 'active'
      }
    ]
  }
}

export const revorgsListResponse: types.RevOrgListResponse = {
  data: {
    rev_orgs: []
  }
}

export const revUsersListResponse: types.RevUserListResponse = {
  data: {
    rev_users: [
      {
        id: 'rev-user-newer',
        created_date: '2023-03-30T23:20:42.676Z',
        display_name: 'test-user',
        email: 'test-user@test.com',
        rev_org: {
          id: 'test-org-newer',
          display_name: 'test-org'
        }
      },
      {
        id: 'rev-user-older',
        display_name: 'test-user',
        email: 'test-user@test.com',
        rev_org: {
          id: 'test-org-older',
          display_name: 'test-org'
        },
        created_date: '2023-03-16T23:20:42.676Z'
      }
    ]
  }
}

export const accountsCreateResponse = {
  data: {}
}

export const revUsersCreateResponse = {
  data: {}
}

export const timelineEntriesCreateResponse = {
  data: {
    timeline_entry: {
      id: 'don:identity:dvrv-us-1:devo/g0NHWj3i:revo/NZQdUYjF:comment/edvgqm7rnp6pc:comment/rjywnhkala5g2'
    }
  }
}

export const partsResponse = {
  data: {
    parts: [
      {
        type: 'product',
        id: 'don:core:dvrv-us-1:devo/g0NHWj3i:product/2',
        created_date: '2023-06-08T17:30:02.353Z',
        display_id: 'PROD-2',
        name: 'BaseProduct'
      }
    ]
  }
}

export const devUserListResponse = {
  data: {
    dev_users: [
      {
        id: 'don:identity:dvrv-us-1:devo/g0NHWj3i:devu/1',
        created_date: '2022-08-28T17:19:52.075Z',
        display_id: 'DEVU-1',
        display_name: 'testy-mctesty',
        email: 'test-email@test.com',
        full_name: 'Tester McTesty',
        state: 'active'
      }
    ]
  }
}

export const devUserSelfResponse = {
  data: {
    dev_user: {
      id: 'don:identity:dvrv-us-1:devo/g0NHWj3i:devu/1'
    }
  }
}

export const settings = {
  apiKey: 'blank',
  devrevApiEndpoint: 'https://api.devrev.ai'
}

export const testEventPayload: Partial<SegmentEvent> = {
  type: 'track',
  userId: 'test-user',
  event: 'test-event',
  timestamp: '2023-06-21T20:29:45.548Z',
  properties: {
    description: 'test body',
    email: 'test-user@test.com',
    name: 'test name'
  }
}

export const event = createTestEvent(testEventPayload)
export const partId = 'don:core:dvrv-us-1:devo/g0NHWj3i:product/2'
export const assignTo = 'don:identity:dvrv-us-1:devo/g0NHWj3i:devu/1'
