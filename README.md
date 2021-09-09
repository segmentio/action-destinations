# Action Destinations

Action Destinations are a way to build streaming destinations on Segment.

## Local Development

This project is a monorepo with multiple packages using Yarn Workspaces:

- `packages/cli` - a set of command line tools for interacting with the repo
- `packages/core` - the core runtime engine for actions, including mapping-kit transforms
- `packages/destinations-actions` - destination definitions and their actions
- `packages/destinations-subscriptions` - validates events against an action's subscription AST

```sh
git clone https://github.com/segmentio/action-destinations.git
cd action-destinations
yarn --ignore-engines --ignore-optional
yarn bootstrap
yarn test
```

## Actions CLI

In order to run the CLI (`./bin/run`), your current working directory needs to be the root of the `action-destinations` repository.

```sh
# see what's supported by the CLI
./bin/run --help

# scaffold a new destination
./bin/run init

# scaffold a new action within a destination
./bin/run generate:action <ACTION_NAME> <browser|server>

# generates TypeScript definitions for an integration
./bin/run generate:types

# start local development server
./bin/run serve
```

For specific information about each CLI command, please refer to this [README](https://github.com/segmentio/action-destinations/tree/main/packages/cli).

### Troubleshooting CLI

If a CLI command fails to work properly, run the command with `DEBUG=*` at the beginning (e.g. `DEBUG=* ./bin/run serve`). This will produce a verbose debugging output, providing hints as to why something isn't working as expected. All of the CLI commands are also in the `./packages/cli/src/commands` directory if you need to inspect them further.

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

When building a destination action, you can write unit and end-to-end tests to ensure your action is working as intended. Tests are automatically run in Buildkite CI on every pull request commit.

Today, our unit tests behave more like <i>integration tests</i> in that you are not only testing the `perform` operation/unit, but also how events + mappings get transformed and validated.

<i> Note: We are planning on providing testing primitives to test individual actions without the needing to understand mappings. This will be more straightforward for devs building actions. </i>

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

## Configuring

Action destinations are configured using a single Destination setting (`subscriptions`) that should contain a JSON blob of all subscriptions for the destination. The format should look like this:

```js
[
  {
    "subscribe": "<fql query>",
    "partnerAction": "<actionSlug>",

    // See ./packages/core/src/mapping-kit/README.md for documentation. The keys in this object should match the `action.fields`
    "mapping": { ... }
  }
]
```

Here's a full example:

```json
[
  {
    "subscribe": "type = 'track'",
    "partnerAction": "postToChannel",
    "mapping": {
      "text": {
        "@template": "Tracked! event={{event}}, {{properties.text}}"
      },
      "url": "https://hooks.slack.com/services/0HL7TC62R/0T276CRHL/8WvI6gEiE9ZqD47kWqYbfIhZ",
      "channel": "test-channel"
    }
  },
  {
    "subscribe": "type = 'identify'",
    "partnerAction": "postToChannel",
    "mapping": {
      "text": {
        "@template": "User identified! email={{email}}"
      },
      "url": "https://hooks.slack.com/services/0HL7TC62R/0T276CRHL/8WvI6gEiE9ZqD47kWqYbfIhZ",
      "channel": "test-channel"
    }
  }
]
```

## License

MIT License

Copyright (c) 2021 Segment

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

All third party contributors acknowledge that any contributions they provide will be made under the same open source license that the open source project is provided under.
