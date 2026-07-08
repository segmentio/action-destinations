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

// 350 real company domains for the large-batch e2e test below.
const COMPANY_DOMAINS: string[] = [
  'microsoft.com',
  'apple.com',
  'google.com',
  'amazon.com',
  'meta.com',
  'netflix.com',
  'adobe.com',
  'salesforce.com',
  'oracle.com',
  'ibm.com',
  'intel.com',
  'nvidia.com',
  'amd.com',
  'qualcomm.com',
  'cisco.com',
  'dell.com',
  'hp.com',
  'hpe.com',
  'sap.com',
  'vmware.com',
  'servicenow.com',
  'workday.com',
  'atlassian.com',
  'slack.com',
  'zoom.us',
  'dropbox.com',
  'box.com',
  'twilio.com',
  'stripe.com',
  'squareup.com',
  'shopify.com',
  'paypal.com',
  'intuit.com',
  'autodesk.com',
  'snowflake.com',
  'datadoghq.com',
  'mongodb.com',
  'elastic.co',
  'hashicorp.com',
  'gitlab.com',
  'github.com',
  'cloudflare.com',
  'fastly.com',
  'akamai.com',
  'digitalocean.com',
  'heroku.com',
  'twitch.tv',
  'reddit.com',
  'pinterest.com',
  'snap.com',
  'linkedin.com',
  'x.com',
  'spotify.com',
  'uber.com',
  'lyft.com',
  'airbnb.com',
  'doordash.com',
  'instacart.com',
  'grubhub.com',
  'yelp.com',
  'ebay.com',
  'etsy.com',
  'wayfair.com',
  'chewy.com',
  'wish.com',
  'zillow.com',
  'redfin.com',
  'opendoor.com',
  'carvana.com',
  'coinbase.com',
  'robinhood.com',
  'sofi.com',
  'affirm.com',
  'klarna.com',
  'plaid.com',
  'chime.com',
  'brex.com',
  'ramp.com',
  'gusto.com',
  'carta.com',
  'hubspot.com',
  'zendesk.com',
  'freshworks.com',
  'asana.com',
  'monday.com',
  'notion.so',
  'airtable.com',
  'figma.com',
  'canva.com',
  'miro.com',
  'docusign.com',
  'okta.com',
  'crowdstrike.com',
  'paloaltonetworks.com',
  'fortinet.com',
  'zscaler.com',
  'sentinelone.com',
  'splunk.com',
  'dynatrace.com',
  'newrelic.com',
  'pagerduty.com',
  'segment.com',
  'mixpanel.com',
  'amplitude.com',
  'braze.com',
  'iterable.com',
  'mparticle.com',
  'sendgrid.com',
  'mailchimp.com',
  'twilio.io',
  'jpmorgan.com',
  'jpmorganchase.com',
  'bankofamerica.com',
  'wellsfargo.com',
  'citi.com',
  'citigroup.com',
  'goldmansachs.com',
  'morganstanley.com',
  'usbank.com',
  'pnc.com',
  'capitalone.com',
  'americanexpress.com',
  'visa.com',
  'mastercard.com',
  'discover.com',
  'schwab.com',
  'fidelity.com',
  'vanguard.com',
  'blackrock.com',
  'statestreet.com',
  'tdbank.com',
  'truist.com',
  'ally.com',
  'hsbc.com',
  'barclays.com',
  'natwest.com',
  'lloydsbank.com',
  'santander.com',
  'deutsche-bank.de',
  'ubs.com',
  'credit-suisse.com',
  'bnpparibas.com',
  'societegenerale.com',
  'ing.com',
  'rabobank.com',
  'nordea.com',
  'db.com',
  'standardchartered.com',
  'macquarie.com',
  'nomura.com',
  'walmart.com',
  'target.com',
  'costco.com',
  'kroger.com',
  'homedepot.com',
  'lowes.com',
  'bestbuy.com',
  'macys.com',
  'nordstrom.com',
  'kohls.com',
  'gap.com',
  'oldnavy.com',
  'nike.com',
  'adidas.com',
  'underarmour.com',
  'lululemon.com',
  'ralphlauren.com',
  'levi.com',
  'hm.com',
  'zara.com',
  'ikea.com',
  'wayfair.co.uk',
  'cvs.com',
  'walgreens.com',
  'riteaid.com',
  'dollargeneral.com',
  'dollartree.com',
  'aldi.us',
  'publix.com',
  'wholefoodsmarket.com',
  'traderjoes.com',
  'sephora.com',
  'ulta.com',
  'petco.com',
  'petsmart.com',
  'autozone.com',
  'oreillyauto.com',
  'advanceautoparts.com',
  'tractorsupply.com',
  'acehardware.com',
  'coca-cola.com',
  'pepsico.com',
  'nestle.com',
  'unilever.com',
  'pg.com',
  'kraftheinz.com',
  'generalmills.com',
  'kelloggs.com',
  'mondelezinternational.com',
  'mars.com',
  'tyson.com',
  'conagrabrands.com',
  'campbells.com',
  'hersheys.com',
  'danone.com',
  'mccormick.com',
  'molsoncoors.com',
  'anheuser-busch.com',
  'diageo.com',
  'heineken.com',
  'starbucks.com',
  'mcdonalds.com',
  'chipotle.com',
  'dominos.com',
  'yum.com',
  'darden.com',
  'dunkindonuts.com',
  'wendys.com',
  'burgerking.com',
  'subway.com',
  'toyota.com',
  'ford.com',
  'gm.com',
  'honda.com',
  'volkswagen.com',
  'bmw.com',
  'mercedes-benz.com',
  'tesla.com',
  'stellantis.com',
  'nissan-global.com',
  'hyundai.com',
  'kia.com',
  'volvocars.com',
  'ferrari.com',
  'porsche.com',
  'caterpillar.com',
  'deere.com',
  'cummins.com',
  'paccar.com',
  'navistar.com',
  'boeing.com',
  'lockheedmartin.com',
  'rtx.com',
  'northropgrumman.com',
  'generaldynamics.com',
  'honeywell.com',
  'ge.com',
  '3m.com',
  'emerson.com',
  'siemens.com',
  'abb.com',
  'schneider-electric.com',
  'rockwellautomation.com',
  'parker.com',
  'illinoistoolworks.com',
  'exxonmobil.com',
  'chevron.com',
  'shell.com',
  'bp.com',
  'totalenergies.com',
  'conocophillips.com',
  'marathonpetroleum.com',
  'phillips66.com',
  'valero.com',
  'schlumberger.com',
  'halliburton.com',
  'bakerhughes.com',
  'occidentalpetroleum.com',
  'dukeenergy.com',
  'nexteraenergy.com',
  'att.com',
  'verizon.com',
  't-mobile.com',
  'comcast.com',
  'charter.com',
  'dish.com',
  'centurylink.com',
  'lumen.com',
  'vodafone.com',
  'orange.com',
  'telefonica.com',
  'deutschetelekom.com',
  'bt.com',
  'telus.com',
  'rogers.com',
  'bell.ca',
  'disney.com',
  'warnerbros.com',
  'paramount.com',
  'nbcuniversal.com',
  'sony.com',
  'fox.com',
  'cbs.com',
  'nytimes.com',
  'wsj.com',
  'bloomberg.com',
  'thomsonreuters.com',
  'condenast.com',
  'hearst.com',
  'gannett.com',
  'jnj.com',
  'pfizer.com',
  'merck.com',
  'abbvie.com',
  'bristolmyerssquibb.com',
  'lilly.com',
  'amgen.com',
  'gilead.com',
  'biogen.com',
  'regeneron.com',
  'moderna.com',
  'novartis.com',
  'roche.com',
  'astrazeneca.com',
  'gsk.com',
  'sanofi.com',
  'bayer.com',
  'novonordisk.com',
  'takeda.com',
  'teva.com',
  'unitedhealthgroup.com',
  'cvshealth.com',
  'cigna.com',
  'humana.com',
  'elevancehealth.com',
  'centene.com',
  'hcahealthcare.com',
  'mckesson.com',
  'cardinalhealth.com',
  'cencora.com',
  'medtronic.com',
  'abbott.com',
  'stryker.com',
  'bostonscientific.com',
  'becton-dickinson.com',
  'edwards.com',
  'intuitivesurgical.com',
  'zimmerbiomet.com',
  'baxter.com',
  'danaher.com',
  'accenture.com',
  'deloitte.com',
  'pwc.com',
  'ey.com',
  'kpmg.com',
  'mckinsey.com',
  'bcg.com',
  'bain.com',
  'capgemini.com',
  'cognizant.com'
]

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
  },
  {
    description: 'Batch with duplicate companies collapses to one element, every row still gets a status',
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
      companyEvent({ companyDomain: 'Adobe.com', linkedInCompanyId: '1480', action: 'ADD' }),
      companyEvent({ companyDomain: 'oracle.com', action: 'ADD' }),
      companyEvent({ action: 'ADD' }),
      companyEvent({ companyDomain: 'adobe.com', linkedInCompanyId: 'urn:li:organization:1480', action: 'ADD' }),
      companyEvent({ linkedInCompanyId: '1476', action: 'ADD' }),
      companyEvent({ companyDomain: 'ibm.com', action: 'ADD' }),
      companyEvent({ companyDomain: 'ADOBE.COM', linkedInCompanyId: '1480', action: 'ADD' }),
      companyEvent({ action: 'REMOVE' }),
      companyEvent({ companyDomain: ' oracle.com ', action: 'ADD' }),
      companyEvent({ linkedInCompanyId: 'urn:li:organization:1476', action: 'ADD' }),
      companyEvent({ companyDomain: 'IBM.com', action: 'ADD' }),
      companyEvent({ companyDomain: 'adobe.com', linkedInCompanyId: '1480', action: 'ADD' })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 201 },
        { status: 201 },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' },
        { status: 201 },
        { status: 201 },
        { status: 201 },
        { status: 201 },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' },
        { status: 201 },
        { status: 201 },
        { status: 201 },
        { status: 201 }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Large batch: add 350 company domains to the audience',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      identifiers: {
        companyDomain: { '@path': '$.properties.companyDomain' }
      },
      action: 'ADD',
      ...hookOutputs
    },
    mode: 'batchWithMultistatus',
    events: COMPANY_DOMAINS.map((companyDomain) => companyEvent({ companyDomain })),
    // LinkedIn returns 201 per element for a successful add; every one of the 350 rows should succeed.
    expect: {
      status: 'success',
      jsonContains: COMPANY_DOMAINS.map(() => ({ status: 201 }))
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
