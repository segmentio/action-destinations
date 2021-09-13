# Build & Testing

## Test Actions Locally

To test a destination action locally, you can spin up a local HTTP server through the Actions CLI.

```sh
# For more information, add the --help flag
./bin/run serve
```

The default port is set to `3000`. To use a different port, you can specify the `PORT` environment variable (e.g. `PORT=3001 ./bin/run serve`).

After running the `serve` command, select the destination you want to test locally. Once a destination is selected, the server should start up.

To test a specific destination action, you can send a Postman or cURL request with the following URL format: `https://localhost:<PORT>/<ACTION>`. A list of eligible URLs will also be provided by the CLI command when the server is spun up.

### Example

The following is an example of a cURL command for `google-analytics-4`'s `search` action. Note that `payload`, `settings`, and `auth` values are all optional in the request body. However, you must still pass in all required fields for the specific destination action under `payload`.

```sh
curl --location --request POST 'http://localhost:3000/search' \
--header 'Content-Type: application/json' \
--data '{
    "payload": {
        "client_id": "<CLIENT_ID>",
        "search_term": "<SEARCH_TERM>"
    },
    "settings": {
        "measurementId": "<MEASUREMENT_ID>",
        "apiSecret": "<API_SECRET>"
    },
    "auth": {
        "accessToken": "<ACCESS_TOKEN>",
        "refreshToken": "<REFRESH_TOKEN>"
    }
}'
```

## Writing Tests

When building a destination action, you should write unit and end-to-end tests to ensure your action is working as intended. Tests are automatically run on every commit in Github Actions. Pull requests that do not include relevant tests will not be approved.

Today, our unit tests behave more like <i>integration tests</i> in that you are not only testing the `perform` operation/unit, but also how events + mappings get transformed and validated.

### Mocking HTTP Requests

While testing, we want to avoid hitting external APIs. We use `nock` to intercept requests before they hit the network.

### Examples

`Testing events + mapping`

```sh
import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import SendGrid from '../index'

const testDestination = createTestDestination(SendGrid)

const SENDGRID_API_KEY = 'some random secret'

describe('SendGrid', () => {
  describe('createList', () => {
    it('should validate action fields', async () => {
      try {
        await testDestination.testAction('createList', {
          settings: { apiKey: SENDGRID_API_KEY },
          skipDefaultMappings: true
        })
      } catch (err) {
        expect(err.message).toContain("missing the required field 'name'.")
      }
    })

    it('should work', async () => {
      nock('https://api.sendgrid.com/v3')
        .post('/marketing/lists', { name: 'Some Name' })
        .reply(200)

      await testDestination.testAction('createList', {
        mapping: { name: 'Some Name' },
        settings: { apiKey: SENDGRID_API_KEY }
      })
    })
  })
})
```

`Testing authentication scheme with unit tests`

```sh
// ...

describe('SendGrid', () => {
  // ...

  describe('authentication', () => {
    it('should validate api keys', async () => {
      try {
        await testDestination.testAuthentication({ apiKey: 'secret' })
      } catch (err) {
        expect(err.message).toContain('API Key should be 32 characters')
      }
    })

    it('should test that authentication works', async () => {
      nock('https://api.sendgrid.com/v3')
        .get('/user/profile')
        .matchHeader('authorization', `Bearer some valid super secret api key`)
        .reply(200, {})

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrow()
    })
    it('should test that authentication fails', async () => {
      nock('https://api.sendgrid.com/v3')
        .get('/user/profile')
        .reply(403, {
          errors: [{ field: null, message: 'access forbidden' }]
        })

      try {
        await testDestination.testAuthentication({ apiKey: `nope this is an invalid key` })
      } catch (err) {
        expect(err.message).toContain('Credentials are invalid')
      }
    })
  })
})
```
