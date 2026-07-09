import type { E2EFixture } from '@segment/actions-core'
import { randomUUID } from 'node:crypto'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import sendForm from '../index'

// The success fixtures submit to a real, approved Marketo form. The form ID is per-instance,
// so it is read from the environment rather than hardcoded. Fixtures are plain modules, so we
// can read process.env directly (the $env marker only resolves inside settings).
const FORM_ID = process.env.E2E_MARKETO_PRIVATE_FORM_ID ?? ''

const FAILURE_HINT =
  'Ensure E2E_MARKETO_PRIVATE_CLIENT_ID, E2E_MARKETO_PRIVATE_CLIENT_SECRET, E2E_MARKETO_PRIVATE_API_DOMAIN and ' +
  'E2E_MARKETO_PRIVATE_FORM_ID are set. The form ID must reference an approved form in your Marketo instance.'

// Marketo de-duplicates leads by email, so a static email upserts the same record on every run.
// We want ONE dynamically-created lead per run, shared across every fixture in that run.
//
// $guid can't do this: the runner gives each fixture its own guid cache, so the same marker
// resolves to a different value per fixture. Instead we generate the email ONCE here at module
// load. The fixtures file is imported a single time per `yarn e2e` invocation, so every fixture
// references the same E2E_USER_EMAIL, and a fresh process (new run) produces a new lead.
const E2E_USER_EMAIL = `e2e-marketo-private-${randomUUID()}@segment.com`

const fixtures: E2EFixture[] = [
  {
    // Happy path: a valid "Form Submitted" event reaches Marketo's submitForm API and is accepted.
    description: 'Successfully submits a lead to a Marketo form (Form Submitted)',
    subscribe: 'event = "Form Submitted" or event = "Registration Succeeded"',
    mapping: {
      ...defaultValues(sendForm.fields),
      formId: FORM_ID,
      // submitForm matches leadFormFields keys against Marketo REST field names (camelCase),
      // not the form's display field IDs. Verified live: these keys create a lead.
      leadFormFields: {
        email: E2E_USER_EMAIL,
        firstName: 'E2E',
        lastName: 'Tester'
      },
      visitorData: {
        pageURL: 'https://example.com/segment-e2e'
      }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Form Submitted', {
      properties: {
        email: E2E_USER_EMAIL
      }
    }),
    expect: {
      status: 'success'
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Happy path for the other subscribed event name: a "Registration Succeeded" event is routed to
    // the same submitForm API and accepted. Uses the SAME lead (E2E_USER_EMAIL) as every other fixture.
    description: 'Successfully submits a lead to a Marketo form (Registration Succeeded)',
    subscribe: 'event = "Form Submitted" or event = "Registration Succeeded"',
    mapping: {
      ...defaultValues(sendForm.fields),
      formId: FORM_ID,
      leadFormFields: {
        email: E2E_USER_EMAIL,
        firstName: 'E2E',
        lastName: 'Tester'
      },
      visitorData: {
        pageURL: 'https://example.com/segment-e2e'
      }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Registration Succeeded', {
      properties: {
        email: E2E_USER_EMAIL
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
        email: E2E_USER_EMAIL
      },
      visitorData: {
        email: E2E_USER_EMAIL
      }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Form Submitted', {
      properties: {
        email: E2E_USER_EMAIL
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
        email: E2E_USER_EMAIL
      },
      visitorData: {
        email: E2E_USER_EMAIL
      }
    },
    mode: 'single',
    event: createE2EEvent('track', 'Form Submitted', {
      properties: {
        email: E2E_USER_EMAIL
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
