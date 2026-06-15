import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
  api_endpoint: 'https://123-ABC-456.mktorest.com'
}

const SUBMIT_FORM_PATH = '/rest/v1/leads/submitForm.json'

function mockAuth() {
  nock(settings.api_endpoint)
    .post('/identity/oauth/token')
    .reply(200, { access_token: 'token', token_type: 'bearer', expires_in: 3599, scope: 'scope' })
}

describe('MarketoPrivate.sendForm', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('submits a Form Submitted event and routes to the default (MG) form', async () => {
    mockAuth()

    let capturedBody: any
    nock(settings.api_endpoint)
      .post(SUBMIT_FORM_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'abc', success: true, result: [{ id: 1, status: 'created' }] })

    const event = createTestEvent({
      event: 'Form Submitted',
      properties: {
        formid: 'Int_MG_Something',
        email: 'jane@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        url: 'https://www.mongodb.com/products'
      }
    })

    const responses = await testDestination.testAction('sendForm', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[responses.length - 1].status).toBe(200)
    expect(capturedBody.formId).toBe(64)
    expect(capturedBody.input[0].leadFormFields.email).toBe('jane@example.com')
    expect(capturedBody.input[0].leadFormFields.firstName).toBe('Jane')
    // removeEmpty strips unset fields.
    expect(capturedBody.input[0].leadFormFields).not.toHaveProperty('phone')
  })

  it('routes contact us forms to form 47 and includes route-specific fields', async () => {
    mockAuth()

    let capturedBody: any
    nock(settings.api_endpoint)
      .post(SUBMIT_FORM_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'abc', success: true, result: [{ id: 1, status: 'created' }] })

    const event = createTestEvent({
      event: 'Form Submitted',
      properties: {
        formid: 'Int_CU_Contact',
        email: 'lead@example.com',
        initialInterest1: 'Atlas'
      }
    })

    await testDestination.testAction('sendForm', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(capturedBody.formId).toBe(47)
    expect(capturedBody.input[0].leadFormFields.customField1).toBe('Atlas')
  })

  it('routes Registration Succeeded to the Atlas Product form with the Atlas campaign id', async () => {
    mockAuth()

    let capturedBody: any
    nock(settings.api_endpoint)
      .post(SUBMIT_FORM_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200, { requestId: 'abc', success: true, result: [{ id: 1, status: 'created' }] })

    const event = createTestEvent({
      event: 'Registration Succeeded',
      properties: {
        email: 'newuser@example.com'
      }
    })

    await testDestination.testAction('sendForm', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(capturedBody.formId).toBe(2)
    expect(capturedBody.input[0].leadFormFields.campaignID).toBe('atlas-registration-1537380126407')
  })

  it('throws for unsupported events', async () => {
    const event = createTestEvent({
      event: 'Some Other Event',
      properties: { email: 'lead@example.com' }
    })

    await expect(
      testDestination.testAction('sendForm', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('is not supported')
  })

  it('throws a PayloadValidationError when Marketo skips the submission', async () => {
    mockAuth()

    nock(settings.api_endpoint)
      .post(SUBMIT_FORM_PATH)
      .reply(200, {
        requestId: 'abc',
        success: true,
        result: [{ status: 'skipped', reasons: [{ code: '1003', message: 'Field email not found' }] }]
      })

    const event = createTestEvent({
      event: 'Form Submitted',
      properties: { formid: 'Int_MG', email: 'lead@example.com' }
    })

    await expect(
      testDestination.testAction('sendForm', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Marketo rejected the form submission')
  })
})
