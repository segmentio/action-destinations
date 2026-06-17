import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import sendForm from '../index'

// The success fixture submits to a real, approved Marketo form. The form ID is per-instance,
// so it is read from the environment rather than hardcoded. Fixtures are plain modules, so we
// can read process.env directly (the $env marker only resolves inside settings).
const FORM_ID = process.env.E2E_MARKETO_PRIVATE_FORM_ID ?? ''

const FAILURE_HINT =
  'Ensure E2E_MARKETO_PRIVATE_CLIENT_ID, E2E_MARKETO_PRIVATE_CLIENT_SECRET, E2E_MARKETO_PRIVATE_API_DOMAIN and ' +
  'E2E_MARKETO_PRIVATE_FORM_ID are set. The form ID must reference an approved form in your Marketo instance.'

const fixtures: E2EFixture[] = [
  {
    // Happy path: a valid Form Submitted event reaches Marketo's submitForm API and is accepted.
    description: 'Successfully submits a lead to a Marketo form',
    subscribe: 'event = "Form Submitted" or event = "Registration Succeeded"',
    mapping: {
      ...defaultValues(sendForm.fields),
      formId: FORM_ID,
      leadFormFields: {
        Email: 'e2e-marketo-private-001@segment.com',
        FirstName: 'E2E',
        LastName: 'Tester'
      },
      visitorData: {
        email: 'e2e-marketo-private-001@segment.com',
        pageURL: 'https://example.com/segment-e2e'
      }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Form Submitted', {
      properties: {
        email: 'e2e-marketo-private-001@segment.com'
      }
    }),
    expect: {
      status: 'success'
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Local validation: formId is required and has no default, so omitting it makes the action throw
    // before any HTTP request. The request never reaches Marketo.
    description: 'Error: missing required formId is rejected before calling Marketo',
    subscribe: 'event = "Form Submitted" or event = "Registration Succeeded"',
    mapping: {
      ...defaultValues(sendForm.fields),
      // formId intentionally omitted
      leadFormFields: {
        Email: 'e2e-marketo-private-002@segment.com'
      },
      visitorData: {
        email: 'e2e-marketo-private-002@segment.com'
      }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Form Submitted', {
      properties: {
        email: 'e2e-marketo-private-002@segment.com'
      }
    }),
    expect: {
      status: 'error',
      errorType: 'AggregateAjvError'
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // API error path: payload passes local validation but the form ID does not exist in Marketo.
    // Marketo returns HTTP 200 with a non-retryable error code, which the action maps to a thrown
    // IntegrationError (PAYLOAD_VALIDATION_FAILED). Exact code/message come from the live response,
    // so we assert the error type only; tighten the message once observed against a live run.
    description: 'Error: Marketo rejects a non-existent form ID',
    subscribe: 'event = "Form Submitted" or event = "Registration Succeeded"',
    mapping: {
      ...defaultValues(sendForm.fields),
      formId: '99999999', // well-formed but non-existent form
      leadFormFields: {
        Email: 'e2e-marketo-private-003@segment.com'
      },
      visitorData: {
        email: 'e2e-marketo-private-003@segment.com'
      }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Form Submitted', {
      properties: {
        email: 'e2e-marketo-private-003@segment.com'
      }
    }),
    expect: {
      status: 'error',
      errorType: 'IntegrationError'
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
