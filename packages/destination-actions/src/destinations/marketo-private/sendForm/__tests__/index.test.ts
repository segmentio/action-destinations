import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
  marketo_api_domain: 'https://123-ABC-456.mktorest.com'
}

// The OAuth2 access token is supplied by the platform (cached from refreshAccessToken) and
// injected into the Authorization header by the destination's extendRequest. In tests we
// pass it via `auth` rather than mocking the token endpoint per action call.
const auth = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token'
}

const SUBMIT_FORM_PATH = '/rest/v1/leads/submitForm.json'

// Mapping mirrors the action fields. leadFormFields / visitorData are free-form objects.
const mapping = {
  event_name: 'Form Submitted',
  email: 'jane@example.com',
  formId: '64',
  leadFormFields: {
    email: 'jane@example.com',
    firstName: 'Jane',
    phone: null,
    company: undefined
  },
  visitorData: {
    email: 'jane@example.com',
    pageURL: 'https://www.mongodb.com/products'
  },
  cookie: 'id:abc&token:xyz'
}

const event = createTestEvent({ event: 'Form Submitted', properties: { email: 'jane@example.com' } })

describe('MarketoPrivate.sendForm', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('submits the form with the bearer token, stripping null/undefined fields', async () => {
    let capturedBody: any
    let authHeader: string | undefined
    nock(settings.marketo_api_domain)
      .post(SUBMIT_FORM_PATH, (body: any) => {
        capturedBody = body
        return true
      })
      .reply(function (this: { req: { headers: Record<string, string | string[]> } }) {
        const header = this.req.headers.authorization
        authHeader = Array.isArray(header) ? header[0] : header
        return [200, { requestId: 'abc', success: true, result: [{ id: 1, status: 'created' }] }]
      })

    const responses = await testDestination.testAction('sendForm', { event, settings, auth, mapping })

    // Only the submitForm call is made; the token is provided via auth, not minted here.
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)

    // Bearer header is set from the platform-supplied access token.
    expect(authHeader).toBe('Bearer test-access-token')

    // Payload shape.
    expect(capturedBody.formId).toBe('64')
    expect(capturedBody.input[0].leadFormFields.email).toBe('jane@example.com')
    expect(capturedBody.input[0].leadFormFields.firstName).toBe('Jane')
    expect(capturedBody.input[0].cookie).toBe('id:abc&token:xyz')

    // removeEmpty strips null and undefined.
    expect(capturedBody.input[0].leadFormFields).not.toHaveProperty('phone')
    expect(capturedBody.input[0].leadFormFields).not.toHaveProperty('company')
  })

  it('succeeds on a created/updated result with no errors', async () => {
    nock(settings.marketo_api_domain)
      .post(SUBMIT_FORM_PATH)
      .reply(200, { requestId: 'abc', success: true, result: [{ id: 7, status: 'updated' }] })

    const responses = await testDestination.testAction('sendForm', { event, settings, auth, mapping })
    expect(responses[0].status).toBe(200)
  })

  it('throws InvalidAuthenticationError on a response-level auth error (602)', async () => {
    nock(settings.marketo_api_domain)
      .post(SUBMIT_FORM_PATH)
      .reply(200, { requestId: 'abc', success: false, errors: [{ code: '602', message: 'Access token expired' }] })

    await expect(testDestination.testAction('sendForm', { event, settings, auth, mapping })).rejects.toMatchObject({
      code: 'INVALID_AUTHENTICATION'
    })
  })

  it('throws a RetryableError on a transient response-level error (611)', async () => {
    nock(settings.marketo_api_domain)
      .post(SUBMIT_FORM_PATH)
      .reply(200, { requestId: 'abc', success: false, errors: [{ code: '611', message: 'System error' }] })

    await expect(testDestination.testAction('sendForm', { event, settings, auth, mapping })).rejects.toMatchObject({
      code: 'RETRYABLE_ERROR'
    })
  })

  it('throws a RetryableError on a transient record-level error (1016)', async () => {
    nock(settings.marketo_api_domain)
      .post(SUBMIT_FORM_PATH)
      .reply(200, {
        requestId: 'abc',
        success: true,
        result: [{ status: 'skipped', reasons: [{ code: '1016', message: 'Too many imports queued' }] }]
      })

    await expect(testDestination.testAction('sendForm', { event, settings, auth, mapping })).rejects.toMatchObject({
      code: 'RETRYABLE_ERROR'
    })
  })

  it('throws a permanent IntegrationError on a non-retryable record-level skip (1004)', async () => {
    nock(settings.marketo_api_domain)
      .post(SUBMIT_FORM_PATH)
      .reply(200, {
        requestId: 'abc',
        success: true,
        result: [{ status: 'skipped', reasons: [{ code: '1004', message: 'Lead not found' }] }]
      })

    await expect(testDestination.testAction('sendForm', { event, settings, auth, mapping })).rejects.toMatchObject({
      code: 'PAYLOAD_VALIDATION_FAILED'
    })
  })

  it('throws a permanent IntegrationError on a non-retryable response-level error (609)', async () => {
    nock(settings.marketo_api_domain)
      .post(SUBMIT_FORM_PATH)
      .reply(200, { requestId: 'abc', success: false, errors: [{ code: '609', message: 'Invalid JSON' }] })

    await expect(testDestination.testAction('sendForm', { event, settings, auth, mapping })).rejects.toMatchObject({
      code: 'PAYLOAD_VALIDATION_FAILED'
    })
  })
})
