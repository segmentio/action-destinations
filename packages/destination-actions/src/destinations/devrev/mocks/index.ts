import { createTestEvent, SegmentEvent } from '@segment/actions-core'
import * as types from '../utils/types'

interface revUserCreateBody {
  email: string
  full_name: string
  org_id: string
}

export const accountId = 'test-account-id'
export const accountName = 'test-account-name'

export const newerCreateDate = '2023-06-02T09:17:21.681Z'
export const olderCreateDate = '2023-04-05T20:14:54.646Z'
export const email = 'test-user@test.com'

export const domain = email.split('@')[1]

export const testUserId = 'test-user-id'
export const testUserFullName = 'test-user-full-name'
export const testDescription = 'test-description'
export const testEventName = 'test-event-name'
export const testMessageId = 'test-message-id'
export const testAnonymousId = 'test-anonymous-id'

export const testContext = {
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
}

export const testEventPayload: Partial<SegmentEvent> = {
  type: 'track',
  userId: testUserId,
  event: testEventName,
  timestamp: newerCreateDate,
  properties: {
    description: testDescription,
    email: email,
    name: testUserFullName
  }
}

export const event = createTestEvent(testEventPayload)
export const partId = 'test-part-id'
export const assignTo = 'test-devuser-id'
export const testDisplayName = 'test-user'
export const testTag = {
  id: 'test-tag-id',
  name: 'test-tag-name'
}

export const testAccountDomain = {
  id: accountId,
  display_name: accountName,
  domains: [domain],
  state: 'active'
}

export const testRevOrgDefaultNewer = {
  id: 'newer-but-default-revo',
  account: testAccountDomain,
  created_date: newerCreateDate,
  display_name: 'newer but default revo',
  external_ref_issuer: 'devrev:platform:revorg:account',
  state: 'active'
}

export const testRevOrgNotDefaultOlder = {
  id: 'older-but-not-default-revo',
  account: testAccountDomain,
  created_date: olderCreateDate,
  display_name: 'older but not default revo',
  external_ref_issuer: 'devrev:platform',
  state: 'active'
}

export const testRevUserNewer = {
  id: 'rev-user-newer',
  created_date: newerCreateDate,
  display_name: testUserFullName,
  email: email,
  rev_org: testRevOrgDefaultNewer
}

export const testRevUserOlder = {
  id: 'rev-user-older',
  display_name: testUserFullName,
  email: email,
  rev_org: testRevOrgNotDefaultOlder,
  created_date: olderCreateDate
}

export const tagsResponse: types.TagsResponse = {
  data: {
    next_cursor: '',
    tags: [testTag]
  }
}

export const accountsListResponse: types.AccountListResponse = {
  data: {
    next_cursor: '',
    accounts: [testAccountDomain]
  }
}

export const revorgsListResponse: types.RevOrgListResponse = {
  data: {
    rev_orgs: [testRevOrgDefaultNewer, testRevOrgNotDefaultOlder]
  }
}

export const revUsersListResponse: types.RevUserListResponse = {
  data: {
    rev_users: [testRevUserNewer, testRevUserOlder]
  }
}

export const revUsersCreateResponse = async (_: never, body: revUserCreateBody) => {
  return {
    rev_user: {
      id: testRevUserNewer.id,
      created_date: newerCreateDate,
      display_name: body.full_name,
      email: body.email,
      rev_org: {
        id: body.org_id,
        display_name: 'test-org'
      }
    }
  }
}

export const accountCreateResponse = async (_: never, body: types.CreateAccountBody) => {
  return {
    account: {
      id: accountId,
      created_date: newerCreateDate,
      display_name: body.display_name,
      domains: body.domains,
      tags: body.tags,
      state: 'active',
      external_refs: body.external_refs
    }
  }
}

export const timelineEntriesCreateResponse = {
  data: {
    timeline_entry: {
      id: 'test-timeline-entry-id'
    }
  }
}

export const devUserSelfResponse = {
  data: {
    dev_user: {
      id: 'test-dev-user-id'
    }
  }
}

export const settings = {
  apiKey: 'blank',
  blacklistedDomains: ''
}
