import type { E2EFixture, SegmentEvent } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import updateCompanyAudience from '../index'

// The real, pre-created COMPANY-type DMP segment these fixtures sync into. Fixtures run in the same
// process as the runner, so they can read process.env directly (the $env marker only resolves inside
// settings). See ../../__e2e__/index.ts for the full list of required environment variables.
const COMPANY_SEGMENT_ID = process.env.E2E_LINKEDIN_COMPANY_SEGMENT_ID ?? ''

// updateCompanyAudience is hook-gated: send() resolves the DMP segment id from
// hookOutputs.retlOnMappingSave.outputs.id. The runner does not execute mapping-save hooks, but
// destination-kit builds hookOutputs by reading the hook key straight off the raw mapping
// (action.ts: `bundle.mapping?.[hookType]`). So we embed the hook output directly in the mapping —
// mirroring how the unit tests supply it — which exercises the real hook-consuming code path with
// no change to the action source. Omit this key to test the "no audience connected" error.
const hookOutputs = {
  retlOnMappingSave: {
    inputs: {},
    outputs: { id: COMPANY_SEGMENT_ID, name: 'e2e Company Audience' }
  }
}

const FAILURE_HINT =
  'Ensure E2E_LINKEDIN_AUDIENCES_ACCESS_TOKEN, E2E_LINKEDIN_AUDIENCES_AD_ACCOUNT_ID, and ' +
  'E2E_LINKEDIN_COMPANY_SEGMENT_ID (a COMPANY-type DMP segment id) are set. ' +
  'To mint a fresh access token: LinkedIn Developer Portal (https://www.linkedin.com/developers/apps) ' +
  '-> open the actions-linkedin-audiences app (its Client ID matches the linkedin-audiences-client-id ' +
  'secret) -> Auth tab -> OAuth 2.0 tools -> Create token -> check the rw_dmp_segments scope -> ' +
  'Request access token, and approve the consent popup as a member with a non-VIEWER role on the ad ' +
  'account. If the scope is missing, the app is not approved for the Audiences program. Access tokens ' +
  'last ~60 days; if a run returns 401 the token has expired, so re-mint it the same way.'

// A minimal track event. Company identifiers and action come from the mapping (not the event body),
// so the event itself carries no personas/audience context.
function companyEvent(properties: Record<string, unknown> = {}): SegmentEvent {
  return {
    type: 'track',
    event: 'Company Audience Sync',
    messageId: '$guid',
    timestamp: '$now',
    properties
  } as unknown as SegmentEvent
}

// defaultValues wires the hidden batching fields. We override identifiers + action per case and
// spread in hookOutputs so send() can resolve the segment id.
const baseMapping = defaultValues(updateCompanyAudience.fields)

const fixtures: E2EFixture[] = [
  {
    description: 'Single ADD by company domain',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      identifiers: { companyDomain: 'microsoft.com' },
      action: 'ADD',
      ...hookOutputs
    },
    mode: 'single',
    event: companyEvent(),
    // A freshly-created segment can briefly reject writes; retries give it time to settle.
    expect: { status: 'success', httpStatus: 200 },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Single ADD by bare LinkedIn company id (wrapped to organizationUrn)',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      identifiers: { linkedInCompanyId: '1035' },
      action: 'ADD',
      ...hookOutputs
    },
    mode: 'single',
    event: companyEvent(),
    expect: { status: 'success', httpStatus: 200 },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Single REMOVE by company domain',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      identifiers: { companyDomain: 'microsoft.com' },
      action: 'REMOVE',
      ...hookOutputs
    },
    mode: 'single',
    event: companyEvent(),
    expect: { status: 'success', httpStatus: 200 },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Single with no identifier throws PayloadValidationError before any HTTP request',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      // Required object present, but neither sub-identifier set => client-side validation error.
      identifiers: {},
      action: 'ADD',
      ...hookOutputs
    },
    mode: 'single',
    event: companyEvent(),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field."
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Single with no connected audience (hook output omitted) throws PayloadValidationError',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      identifiers: { companyDomain: 'microsoft.com' },
      action: 'ADD'
      // hookOutputs intentionally omitted => send() cannot resolve a segment id.
    },
    mode: 'single',
    event: companyEvent(),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage:
        'No LinkedIn Company Audience is connected to this mapping. Please re-save the mapping to create or select a Company Audience.'
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Batch ADD by domain + ADD by id + REMOVE by domain, all valid',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      // identifiers/action come from each event's properties so a single mapping covers the batch.
      identifiers: {
        companyDomain: { '@path': '$.properties.companyDomain' },
        linkedInCompanyId: { '@path': '$.properties.linkedInCompanyId' }
      },
      action: { '@path': '$.properties.action' },
      ...hookOutputs
    },
    mode: 'batchWithMultistatus',
    events: [
      companyEvent({ companyDomain: 'linkedin.com', action: 'ADD' }),
      companyEvent({ linkedInCompanyId: '1337', action: 'ADD' }),
      companyEvent({ companyDomain: 'salesforce.com', action: 'REMOVE' })
    ],
    // LinkedIn returns 201 per element for successful add/remove (idempotent by design).
    expect: {
      status: 'success',
      jsonContains: [{ status: 201 }, { status: 201 }, { status: 201 }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Batch with a valid ADD, a valid REMOVE, and a no-identifier row (per-item 400)',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      identifiers: {
        companyDomain: { '@path': '$.properties.companyDomain' },
        linkedInCompanyId: { '@path': '$.properties.linkedInCompanyId' }
      },
      action: { '@path': '$.properties.action' },
      ...hookOutputs
    },
    mode: 'batchWithMultistatus',
    events: [
      companyEvent({ companyDomain: 'microsoft.com', action: 'ADD' }),
      companyEvent({ companyDomain: 'salesforce.com', action: 'REMOVE' }),
      // No identifier => per-item PAYLOAD_VALIDATION_FAILED, other rows still succeed.
      companyEvent({ action: 'ADD' })
    ],
    expect: {
      status: 'success',
      jsonContains: [{ status: 201 }, { status: 201 }, { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' }]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
