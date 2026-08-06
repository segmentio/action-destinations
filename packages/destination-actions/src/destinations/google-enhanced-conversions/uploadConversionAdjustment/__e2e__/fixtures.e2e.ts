import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import uploadConversionAdjustment from '../index'

// The conversion action ID is per-account, so it is read from the environment rather than hardcoded.
// Fixtures are plain modules, so we can read process.env directly (the $env marker only resolves
// inside settings). See ../../__e2e__/index.ts for the settings-level env wiring.
const CONVERSION_ACTION_ID = process.env.E2E_GOOGLE_ADS_CONVERSION_ACTION_ID ?? ''

const FAILURE_HINT =
  'Ensure E2E_GOOGLE_ADS_CONVERSION_ACTION_ID references a valid conversion action in the Google Ads ' +
  'account and ADWORDS_DEVELOPER_TOKEN is set. The customerId in settings must be a valid Google Ads account.'

const fixtures: E2EFixture[] = [
  {
    // Basic happy path: a single ENHANCEMENT adjustment reaches the Google Ads
    // uploadConversionAdjustments API and is accepted. adjustment_type is required; order_id and an
    // email identifier give the enhancement something to attach to the original conversion.
    description: 'Uploads a single conversion adjustment with basic information',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(uploadConversionAdjustment.fields),
      conversion_action: CONVERSION_ACTION_ID,
      adjustment_type: 'ENHANCEMENT'
    },
    mode: 'single',
    event: createE2EEvent('track', 'Order Completed', {
      userId: 'e2e-google-adj-001',
      properties: {
        email: 'e2e-google-adj-001@segment.com',
        orderId: '$guid:orderId'
      }
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
