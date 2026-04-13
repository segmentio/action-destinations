/**
 * Validation fixtures for Klaviyo API upgrade testing.
 *
 * One fixture per unique API endpoint. These make real HTTP calls against
 * both the stable and canary revisions and diff the response shapes.
 *
 * Credentials are read from env vars (never hardcoded):
 *   KLAVIYO_TEST_API_KEY   - Klaviyo private API key for test account
 *   KLAVIYO_TEST_LIST_ID   - Pre-existing list ID in the test account
 */

export interface Fixture {
  id: string // unique name for this fixture, used in report
  description: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  // body can be static or a function receiving the revision string.
  // Use a function when the body contains identifiers that must differ
  // between stable and canary calls to avoid conflicts (e.g. POST /profiles/
  // returns 409 if the same email is submitted twice sequentially).
  body?: unknown | ((revision: string) => unknown)
}

// Each run gets a unique ID so repeated runs don't collide on existing profiles/events.
const RUN_ID = Date.now()

// Returns an email scoped to both the run and the revision being tested,
// ensuring stable and canary calls never conflict with each other.
const revisionEmail = (revision: string, suffix = '') => `validation-${revision}-${RUN_ID}${suffix}@example.com`

const revisionExternalId = (revision: string) => `validation-${revision}-${RUN_ID}`

// Used for read-only fixtures where a single shared email is fine
const TEST_EMAIL = `validation-${RUN_ID}@example.com`

export function buildFixtures(listId: string): Fixture[] {
  return [
    // -------------------------------------------------------------------------
    // Profiles
    // -------------------------------------------------------------------------
    {
      id: 'POST /profiles/ (upsert single profile)',
      description: 'Create or update a profile by email',
      method: 'POST',
      path: '/profiles/',
      body: (revision: string) => ({
        data: {
          type: 'profile',
          attributes: {
            email: revisionEmail(revision),
            external_id: revisionExternalId(revision),
            first_name: 'Validation',
            last_name: 'Test',
            properties: { source: 'api-validation' }
          }
        }
      })
    },

    // -------------------------------------------------------------------------
    // Profile bulk import (batched upsert / addProfileToList)
    // -------------------------------------------------------------------------
    {
      id: 'POST /profile-bulk-import-jobs/ (bulk upsert, no list)',
      description: 'Bulk import profiles without a list association',
      method: 'POST',
      path: '/profile-bulk-import-jobs/',
      body: (revision: string) => ({
        data: {
          type: 'profile-bulk-import-job',
          attributes: {
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes: {
                    email: revisionEmail(revision, '-bulk'),
                    external_id: revisionExternalId(revision) + '-bulk',
                    first_name: 'Validation',
                    last_name: 'Test'
                  }
                }
              ]
            }
          }
        }
      })
    },
    {
      id: 'POST /profile-bulk-import-jobs/ (bulk upsert, with list)',
      description: 'Bulk import profiles with a list association',
      method: 'POST',
      path: '/profile-bulk-import-jobs/',
      body: (revision: string) => ({
        data: {
          type: 'profile-bulk-import-job',
          attributes: {
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes: {
                    email: revisionEmail(revision, '-bulk-list'),
                    external_id: revisionExternalId(revision) + '-bulk-list'
                  }
                }
              ]
            }
          },
          relationships: {
            lists: {
              data: [{ type: 'list', id: listId }]
            }
          }
        }
      })
    },

    // -------------------------------------------------------------------------
    // List membership
    // -------------------------------------------------------------------------
    {
      id: 'GET /lists/',
      description: 'Fetch all lists (used for dynamic field population)',
      method: 'GET',
      path: '/lists/'
    },
    {
      id: 'GET /profiles/ (filter by email)',
      description: 'Look up profile IDs by email (used before list removal)',
      method: 'GET',
      path: `/profiles/?filter=any(email,["${TEST_EMAIL}"])`
    },

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    {
      id: 'POST /events/ (single track event)',
      description: 'Track a single event against a profile',
      method: 'POST',
      path: '/events/',
      body: (revision: string) => ({
        data: {
          type: 'event',
          attributes: {
            properties: { source: 'api-validation', plan: 'enterprise' },
            time: new Date().toISOString(),
            value: 99.99,
            unique_id: `validation-event-${revision}-${RUN_ID}`,
            metric: {
              data: {
                type: 'metric',
                attributes: { name: 'Validation Test Event' }
              }
            },
            profile: {
              data: {
                type: 'profile',
                attributes: { email: TEST_EMAIL }
              }
            }
          }
        }
      })
    },
    {
      id: 'POST /event-bulk-create-jobs/ (batched track events)',
      description: 'Bulk create events (batched trackEvent / orderCompleted)',
      method: 'POST',
      path: '/event-bulk-create-jobs/',
      body: (revision: string) => ({
        data: {
          type: 'event-bulk-create-job',
          attributes: {
            'events-bulk-create': {
              data: [
                {
                  type: 'event-bulk-create',
                  attributes: {
                    profile: {
                      data: {
                        type: 'profile',
                        attributes: { email: TEST_EMAIL }
                      }
                    },
                    events: {
                      data: [
                        {
                          type: 'event',
                          attributes: {
                            metric: {
                              data: {
                                type: 'metric',
                                attributes: { name: 'Validation Bulk Event' }
                              }
                            },
                            properties: { source: 'api-validation' },
                            time: new Date().toISOString(),
                            value: 49.99,
                            unique_id: `validation-bulk-event-${revision}-${RUN_ID}`
                          }
                        }
                      ]
                    }
                  }
                }
              ]
            }
          }
        }
      })
    },

    // -------------------------------------------------------------------------
    // Subscriptions
    // -------------------------------------------------------------------------
    {
      id: 'POST /profile-subscription-bulk-create-jobs/ (subscribe)',
      description: 'Subscribe a profile to email/SMS marketing',
      method: 'POST',
      path: '/profile-subscription-bulk-create-jobs/',
      body: (revision: string) => ({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            historical_import: false,
            custom_source: 'api-validation',
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes: {
                    email: revisionEmail(revision, '-sub'),
                    subscriptions: {
                      email: { marketing: { consent: 'SUBSCRIBED' } }
                    }
                  }
                }
              ]
            }
          },
          relationships: {
            list: { data: { type: 'list', id: listId } }
          }
        }
      })
    },
    {
      id: 'POST /profile-subscription-bulk-delete-jobs (unsubscribe)',
      description: 'Unsubscribe a profile from email/SMS marketing',
      method: 'POST',
      path: '/profile-subscription-bulk-delete-jobs',
      body: (revision: string) => ({
        data: {
          type: 'profile-subscription-bulk-delete-job',
          attributes: {
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes: {
                    email: revisionEmail(revision, '-sub'),
                    subscriptions: {
                      email: { marketing: { consent: 'UNSUBSCRIBED' } }
                    }
                  }
                }
              ]
            }
          },
          relationships: {
            list: { data: { type: 'list', id: listId } }
          }
        }
      })
    }
  ]
}
