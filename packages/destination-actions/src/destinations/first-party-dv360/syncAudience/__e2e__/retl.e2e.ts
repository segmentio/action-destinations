import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2ERetlAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'
import { CONTACT_INFO } from '../constants'

const COMPUTATION_KEY = 'e2e_test_dv360_retl'
const COMPUTATION_ID = 'aud_e2e_dv360_retl_001'

const FAILURE_HINT =
  'Needs E2E_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,ADVERTISER_ID,APP_ID} and ' +
  'ACTIONS_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET}. The refresh token must carry the display-video ' +
  'scope and reach the advertiser: the copy in the secret store has expired, so read a live one from ' +
  'the oauth row of a staging destination instance.'

const ADVERTISER_ID = process.env.E2E_FIRST_PARTY_DV360_ADVERTISER_ID ?? ''

const AUDIENCE = { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }

// A warehouse sync has no Engage audience behind it, so there are no audience settings holding the
// advertiser and the audience type: all three details come from the retlOnMappingSave hook, which
// the action reads out of the mapping. The events below carry no external_audience_id at all, so
// none of these can pass unless the hook output is used.
const mapping = {
  ...defaultValues(syncAudience.fields),
  audience_type: CONTACT_INFO,
  retlOnMappingSave: {
    outputs: {
      audienceId: '$externalAudienceId:contactInfo',
      advertiserId: ADVERTISER_ID,
      audienceType: CONTACT_INFO
    }
  }
}

// What is reported against an event is the request as it would have been had it carried that event
// alone, so the list it travelled in is visible per index. Consent has no default, and an unmapped
// consent leaves the key off altogether.
const added = (member: unknown) => ({ advertiserId: ADVERTISER_ID, addedContactInfoList: { contactInfos: [member] } })
const removed = (member: unknown) => ({
  advertiserId: ADVERTISER_ID,
  removedContactInfoList: { contactInfos: [member] }
})

const row = (eventName: 'new' | 'updated' | 'deleted', userId: string) =>
  createE2ERetlAudienceEvent({
    eventName,
    computationKey: COMPUTATION_KEY,
    computationId: COMPUTATION_ID,
    userId,
    email: `${userId}@segment.com`
  })

const accepted = (sent: unknown) => ({
  status: 'success' as const,
  jsonContains: [{ status: 200, sent, body: AUDIENCE }]
})

// A warehouse sync resolves add from remove by sync mode and the RETL event name, not by a
// membership boolean carried on the event.
const fixtures: E2EFixture[] = [
  {
    description: 'RETL: syncMode add sends "new" rows as adds',
    subscribe: 'type = "track"',
    mapping: { ...mapping, __segment_internal_sync_mode: 'add' },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [row('new', 'e2e-dv360-retl-new')],
    expect: accepted(added({ hashedEmails: ['e7e329af307444ecce80d7b0c7d19213cc9a791957bfef15452a645ec43da1f3'] })),
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL: syncMode delete sends "deleted" rows as removes',
    subscribe: 'type = "track"',
    mapping: { ...mapping, __segment_internal_sync_mode: 'delete' },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [row('deleted', 'e2e-dv360-retl-deleted')],
    expect: accepted(removed({ hashedEmails: ['275cc29daa8229671f5bac16b449d4f954e6617b932d80dd0a650b96798c942a'] })),
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL: syncMode mirror sends "updated" rows as adds',
    subscribe: 'type = "track"',
    mapping: { ...mapping, __segment_internal_sync_mode: 'mirror' },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [row('updated', 'e2e-dv360-retl-updated')],
    expect: accepted(added({ hashedEmails: ['fd5c9cbabb6a2feaee8a448cb01c2e1c96f5f5a6000f866d18194f4af626d4d4'] })),
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
