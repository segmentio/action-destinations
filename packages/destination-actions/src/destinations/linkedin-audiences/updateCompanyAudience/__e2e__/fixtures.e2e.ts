import type { E2EFixture, SegmentEvent } from '@segment/actions-core'
import {
  defaultValues,
  createE2EEvent,
  createE2EEngageAudienceEvent,
  createE2ERetlAudienceEvent
} from '@segment/actions-core'
import updateCompanyAudience from '../index'

// A fixed key whose segment is created on the first-ever run and simply found (populated) on every
// run after that — this is our "populate an existing audience" scenario. One per audience_source so
// the ENGAGE_RETL and CONNECTIONS existing-segment tests don't collide.
const EXISTING_ENGAGE_KEY = 'e2e-existing-company-audience'
const EXISTING_CONNECTIONS_KEY = 'e2e-existing-connections-audience'

// A unique-per-run key so the "creates a new audience" scenario genuinely exercises the create path
// every run. NOTE: LinkedIn has no segment-delete API, so each run leaves a new COMPANY segment in the
// ad account. These accumulate over time and should be cleaned up manually in Campaign Manager
// periodically. Date.now() is fine here — this is a normal Node module, not a deterministic workflow.
const NEW_ENGAGE_KEY = `e2e-new-company-${Date.now()}`
const NEW_CONNECTIONS_KEY = `e2e-new-connections-${Date.now()}`

const FAILURE_HINT =
  'Ensure E2E_LINKEDIN_AUDIENCES_ACCESS_TOKEN and E2E_LINKEDIN_AUDIENCES_AD_ACCOUNT_ID are set. ' +
  'The DMP Company Segment is looked up (or created) live by sourceSegmentId, so no segment id env ' +
  'var is required. To mint a fresh access token: LinkedIn Developer Portal ' +
  '(https://www.linkedin.com/developers/apps) -> open the actions-linkedin-audiences app (its Client ' +
  'ID matches the linkedin-audiences-client-id secret) -> Auth tab -> OAuth 2.0 tools -> Create token ' +
  '-> check the rw_dmp_segments scope -> Request access token, and approve the consent popup as a ' +
  'member with a non-VIEWER role on the ad account. If the scope is missing, the app is not approved ' +
  'for the Audiences program. Access tokens last ~60 days; if a run returns 401 the token has expired, ' +
  'so re-mint it the same way.'

// The (fixed) audience key + computation id used by the Engage/RETL helper events below.
const HELPER_COMPUTATION_KEY = 'e2e_company_audience'
const HELPER_COMPUTATION_ID = 'e2e_company_computation'

// CONNECTIONS events are plain Segment Connections track events (no personas/audience context).
// createE2EEvent is the dedicated "Connections event" helper. Company identifier goes in properties.
const connectionsEvent = (properties: Record<string, string> = {}): SegmentEvent =>
  createE2EEvent('track', 'Company Audience Sync', { properties })

// Engage events carry the membership boolean at properties[computationKey]; the company identifier
// (and, for batches, the per-event dmp action string) ride in enrichedTraits, which the helper
// spreads into properties. `membership` sets that boolean — irrelevant to our action, but for the
// realism fixtures we set it OPPOSITE to dmp_company_action to document that the boolean is ignored.
const engageEvent = (enrichedTraits: Record<string, string> = {}, membership: 'add' | 'remove' = 'add'): SegmentEvent =>
  createE2EEngageAudienceEvent({
    type: 'track',
    action: membership,
    computationKey: HELPER_COMPUTATION_KEY,
    computationId: HELPER_COMPUTATION_ID,
    enrichedTraits
  })

// Reverse ETL events use RETL event names ('new'/'updated'/'deleted'); 'deleted' => membership false.
const retlEvent = (
  enrichedTraits: Record<string, string> = {},
  eventName: 'new' | 'updated' | 'deleted' = 'new'
): SegmentEvent =>
  createE2ERetlAudienceEvent({
    eventName,
    computationKey: HELPER_COMPUTATION_KEY,
    computationId: HELPER_COMPUTATION_ID,
    enrichedTraits
  })

// defaultValues wires the hidden batching fields. Each fixture overrides identifiers, action, and the
// segment-resolution fields (audience_source + computation_key/segment_name) as needed.
const baseMapping = defaultValues(updateCompanyAudience.fields)

// Mapping helpers for the two sources, so fixtures stay concise and can't drift on field names.
const engage = (key: string, extra: Record<string, unknown>) => ({
  ...baseMapping,
  audience_source: 'ENGAGE_RETL',
  computation_key: key,
  ...extra
})
const connections = (key: string, extra: Record<string, unknown>) => ({
  ...baseMapping,
  audience_source: 'CONNECTIONS',
  segment_name: key,
  ...extra
})

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

// Per-event identifiers/action for batch fixtures (a single mapping covers the whole batch).
const perEventIdentifiers = {
  identifiers: {
    companyDomain: { '@path': '$.properties.companyDomain' },
    linkedInCompanyId: { '@path': '$.properties.linkedInCompanyId' }
  },
  dmp_company_action: { '@path': '$.properties.action' }
}

const fixtures: E2EFixture[] = [
  // ---- ENGAGE (Engage audience event): populate an EXISTING audience (fixed key) ----
  // The Engage event's membership boolean is intentionally 'remove' while dmp_company_action is ADD,
  // documenting that the action is governed by dmp_company_action, not the boolean. (The boolean is
  // truly unobservable at the e2e layer — the override itself is proven in the unit tests.)
  {
    description: 'Engage: single ADD by company domain (existing audience); dmp_company_action governs',
    subscribe: 'type = "track"',
    mapping: engage(EXISTING_ENGAGE_KEY, {
      identifiers: { companyDomain: { '@path': '$.properties.companyDomain' } },
      dmp_company_action: 'ADD'
    }),
    mode: 'single',
    event: engageEvent({ companyDomain: 'microsoft.com' }, 'remove'),
    // A freshly-created segment can briefly reject writes; retries give it time to settle.
    expect: { status: 'success', httpStatus: 200 },
    verboseFailureHint: FAILURE_HINT
  },
  // Note: single ADD-by-bare-id and single REMOVE are intentionally not separate fixtures — at the
  // e2e layer they are indistinguishable from the ADD-by-domain case (LinkedIn returns 201 for every
  // valid add/remove and the runner can't inspect the outbound request body). Both are covered by the
  // batch fixtures below, and the ADD/REMOVE-vs-membership-boolean behavior is proven in the unit tests.
  // ---- ENGAGE: CREATE a new audience (unique key per run) ----
  {
    description: 'Engage: single ADD creates a new audience when none exists for the key',
    subscribe: 'type = "track"',
    mapping: engage(NEW_ENGAGE_KEY, {
      identifiers: { companyDomain: { '@path': '$.properties.companyDomain' } },
      dmp_company_action: 'ADD'
    }),
    mode: 'single',
    event: engageEvent({ companyDomain: 'microsoft.com' }),
    expect: { status: 'success', httpStatus: 200 },
    verboseFailureHint: FAILURE_HINT
  },
  // ---- CONNECTIONS (plain Connections event): populate an EXISTING audience (fixed key) ----
  {
    description: 'Connections: single ADD by company domain (existing audience via segment_name)',
    subscribe: 'type = "track"',
    mapping: connections(EXISTING_CONNECTIONS_KEY, {
      identifiers: { companyDomain: 'microsoft.com' },
      dmp_company_action: 'ADD'
    }),
    mode: 'single',
    event: connectionsEvent(),
    expect: { status: 'success', httpStatus: 200 },
    verboseFailureHint: FAILURE_HINT
  },
  // ---- CONNECTIONS: CREATE a new audience (unique key per run) ----
  {
    description: 'Connections: single ADD creates a new audience when segment_name does not exist',
    subscribe: 'type = "track"',
    mapping: connections(NEW_CONNECTIONS_KEY, {
      identifiers: { companyDomain: 'microsoft.com' },
      dmp_company_action: 'ADD'
    }),
    mode: 'single',
    event: connectionsEvent(),
    expect: { status: 'success', httpStatus: 200 },
    verboseFailureHint: FAILURE_HINT
  },
  // ---- Negative: no identifier (single) => validation error before any HTTP request ----
  {
    description: 'Single with no identifier throws PayloadValidationError before any HTTP request',
    subscribe: 'type = "track"',
    // Required object present, but neither sub-identifier set => client-side validation error.
    mapping: engage(EXISTING_ENGAGE_KEY, { identifiers: {}, dmp_company_action: 'ADD' }),
    mode: 'single',
    event: connectionsEvent(),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field."
    },
    verboseFailureHint: FAILURE_HINT
  },
  // ---- Negative: missing lookup key for the chosen source => conditional-required validation error ----
  {
    description: 'ENGAGE_RETL with empty computation_key fails schema validation (conditionally required)',
    subscribe: 'type = "track"',
    mapping: {
      ...baseMapping,
      audience_source: 'ENGAGE_RETL',
      computation_key: '',
      identifiers: { companyDomain: 'microsoft.com' },
      dmp_company_action: 'ADD'
    },
    mode: 'single',
    event: connectionsEvent(),
    expect: {
      status: 'error',
      errorType: 'AggregateAjvError',
      errorMessage:
        'The root value is missing the required field \'computation_key\'. The root value must match "then" schema.'
    },
    verboseFailureHint: FAILURE_HINT
  },
  // ---- ENGAGE batch: mixed valid add/add/remove (Engage audience events) ----
  {
    description: 'Engage batch: ADD by domain + ADD by id + REMOVE by domain, all valid',
    subscribe: 'type = "track"',
    mapping: engage(EXISTING_ENGAGE_KEY, perEventIdentifiers),
    mode: 'batchWithMultistatus',
    events: [
      engageEvent({ companyDomain: 'linkedin.com', action: 'ADD' }),
      engageEvent({ linkedInCompanyId: '1337', action: 'ADD' }),
      engageEvent({ companyDomain: 'salesforce.com', action: 'REMOVE' }, 'remove')
    ],
    // LinkedIn returns 201 per element for successful add/remove (idempotent by design).
    expect: {
      status: 'success',
      jsonContains: [{ status: 201 }, { status: 201 }, { status: 201 }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  // ---- ENGAGE batch: per-item no-identifier 400, other rows still succeed ----
  {
    description: 'Engage batch with a valid ADD, a valid REMOVE, and a no-identifier row (per-item 400)',
    subscribe: 'type = "track"',
    mapping: engage(EXISTING_ENGAGE_KEY, perEventIdentifiers),
    mode: 'batchWithMultistatus',
    events: [
      engageEvent({ companyDomain: 'microsoft.com', action: 'ADD' }),
      engageEvent({ companyDomain: 'salesforce.com', action: 'REMOVE' }, 'remove'),
      // No identifier => per-item PAYLOAD_VALIDATION_FAILED, other rows still succeed.
      engageEvent({ action: 'ADD' })
    ],
    expect: {
      status: 'success',
      jsonContains: [{ status: 201 }, { status: 201 }, { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  // ---- ENGAGE batch: duplicate companies collapse to one element, every row still gets a status ----
  {
    description: 'Engage batch with duplicate companies collapses to one element, every row still gets a status',
    subscribe: 'type = "track"',
    mapping: engage(EXISTING_ENGAGE_KEY, perEventIdentifiers),
    mode: 'batchWithMultistatus',
    events: [
      engageEvent({ companyDomain: 'Adobe.com', linkedInCompanyId: '1480', action: 'ADD' }),
      engageEvent({ companyDomain: 'oracle.com', action: 'ADD' }),
      engageEvent({ action: 'ADD' }),
      engageEvent({ companyDomain: 'adobe.com', linkedInCompanyId: 'urn:li:organization:1480', action: 'ADD' }),
      engageEvent({ linkedInCompanyId: '1476', action: 'ADD' }),
      engageEvent({ companyDomain: 'ibm.com', action: 'ADD' }),
      engageEvent({ companyDomain: 'ADOBE.COM', linkedInCompanyId: '1480', action: 'ADD' }),
      engageEvent({ action: 'REMOVE' }, 'remove'),
      engageEvent({ companyDomain: ' oracle.com ', action: 'ADD' }),
      engageEvent({ linkedInCompanyId: 'urn:li:organization:1476', action: 'ADD' }),
      engageEvent({ companyDomain: 'IBM.com', action: 'ADD' }),
      engageEvent({ companyDomain: 'adobe.com', linkedInCompanyId: '1480', action: 'ADD' })
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
  // ---- Reverse ETL large batch (RETL audience events) ----
  {
    description: 'Reverse ETL large batch: add 350 company domains to the audience',
    subscribe: 'type = "track"',
    mapping: engage(EXISTING_ENGAGE_KEY, {
      identifiers: { companyDomain: { '@path': '$.properties.companyDomain' } },
      dmp_company_action: 'ADD'
    }),
    mode: 'batchWithMultistatus',
    // RETL events ('new' => membership true); dmp_company_action ADD drives the add regardless.
    events: COMPANY_DOMAINS.map((companyDomain) => retlEvent({ companyDomain })),
    // LinkedIn returns 201 per element for a successful add; every one of the 350 rows should succeed.
    expect: {
      status: 'success',
      jsonContains: COMPANY_DOMAINS.map(() => ({ status: 201 }))
    },
    verboseFailureHint: FAILURE_HINT
  },
  // ---- Reverse ETL single (RETL audience event); dmp_company_action governs ----
  // The RETL event is 'deleted' (membership false) while dmp_company_action is ADD, documenting that
  // the action is governed by dmp_company_action, not the event name. At the e2e layer this only
  // asserts the call succeeds (LinkedIn returns 201 for both add and remove, and the runner can't
  // inspect the outbound request body) — the override itself is proven in the unit tests.
  {
    description: 'Reverse ETL: single ADD (event "deleted") into existing audience; dmp_company_action governs',
    subscribe: 'type = "track"',
    mapping: engage(EXISTING_ENGAGE_KEY, {
      identifiers: { companyDomain: { '@path': '$.properties.companyDomain' } },
      dmp_company_action: 'ADD'
    }),
    mode: 'single',
    event: retlEvent({ companyDomain: 'microsoft.com' }, 'deleted'),
    expect: { status: 'success', httpStatus: 200 },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
