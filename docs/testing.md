# Build & Test Cloud Destinations

- [Build & Test Cloud Destinations](#build--test-cloud-destinations)
  - [Approaches to local testing](#approaches-to-local-testing)
  - [Local testing with the Actions Tester](#local-testing-with-the-actions-tester)
  - [Local testing with cURL or Postman](#local-testing-with-curl-or-postman)
    - [Testing an Action's perform() or performBatch() function](#testing-an-actions-perform-or-performbatch-function)
    - [Example request to invoke perform()](#example-request-to-invoke-perform)
    - [Example request to invoke performBatch()](#example-request-to-invoke-performbatch)
    - [Example request to invoke testAuthentication()](#example-request-to-invoke-testauthentication)
  - [Unit Testing](#unit-testing)
    - [Mocking HTTP Requests](#mocking-http-requests)
    - [Examples](#examples)
  - [Snapshot Testing](#snapshot-testing)
  - [Code Coverage](#code-coverage)
- [Post Deployment Change Testing](#post-deployment-change-testing)

## Approaches to local testing

There are 2 ways in which you can do local testing. Both require running a local server - which is explained below.

Approach 1: Use the [Actions Tester](#local-testing-with-the-actions-tester): The Actions Tester provides a UI which allows you to specify an inbound Segment API call payload - such as a track() or identify() payload - and route that payload to an Action's perform() function in your Destination. The Destination's Settings Fields and Action Fields are rendered in the UI and provide an approximation of what the customer will see when configuring the Destination. The perform() function will then send data to your Platform.

Approach 2: [Local testing with cURL or Postman](#local-testing-with-curl-or-postman): You can use an API testing tool such as cURL or Postman to test not only an Action's perform() function, but also the performBatch(), delete() and testAuthentication() functions. With this approach there is no UI so you'll need to provide not only the payload from an inbound Segment API call - such as a track() or identify() payload, but potentially other objects such as settings or mapping objects in your HTTP request.

Note: there is no 'Staging' platform available, so the testing you'll be doing will all be local until your Integration has been deployed to Segment's Production environment. When your Integration has been deployed to Production it will initially be set to 'Private Beta' mode and will not be findable by customers in the Catalog. However you will be able to set up and configure your Integration via a URL so that you can do further testing.

## Local testing with the Actions Tester

In order to see a visual representation of the settings/mappings fields we provide a tool to preview and execute simulated actions mappings against your in development destination. For more information on how to use actions tester [click here](./actions_tester.md).

## Local testing with cURL or Postman

To test a destination action locally you can spin up a local HTTP server through the Actions CLI.

```sh
# For more information, add the --help flag
./bin/run serve
```

The default port is set to `3000`. To use a different port, you can specify the `PORT` environment variable (e.g. `PORT=3001 ./bin/run serve`). The examples in this documenation will assume `PORT` is set to `3000`.

After running the `serve` command, select the destination you want to test locally. Once a destination is selected the server should start up.

### Testing an Action's perform() or performBatch() function

To test a specific destination action's perform() or performBatch() function you can send a Postman or cURL request with the following URL format: `https://localhost:<PORT>/<ACTION>`. A list of eligible URLs will also be provided by the CLI command when the server is spun up.

For example if you wanted to test the the Emarsys Destination's upsertContact Action the URL you would POST to would be: `http://localhost:3000/upsertContact`.

### Example request to invoke perform()

The following is an example of a cURL command which will invoke the Emarsys Destination's `upsertContact` Action (Emarsys is an email tool popular with some Segment customers). Data for 3 objects is included in the data/body: `payload`, `mapping` and `settings`.

#### Example oauth object

Emarsys doesn't use OAuth so you can leave out the `auth` object; however you if your Integration is using OAuth then you'll need to include an `oauth` object in the HTTP request.

```sh
  "oauth": {
    "access_token": "<OAUTH-ACCESS-TOKEN>"
  }
```

`payload` - this should contain the payload coming in to your Integration. It could be a track() or identify() or other payload. In the example below only the fields needed by the Emarsys upsertContact Action are included.
`mapping` - this should include mappings to be applied to the payload in order to extract out the field data you want to pass to the perform() function.
`settings` - this should include the Settings fields data to be passed to the perform() function. In the case of Emarsys there are only 2 Settings fields, the api_user and api_password fields.

```sh
curl --location --request POST 'http://localhost:3000/upsertContact' \
--header 'Content-Type: application/json' \
--data '{
  "mapping": {
    "key_field": { "@path": "$.properties.key_field" },
    "key_value": { "@path": "$.properties.key_value" },
    "write_field": { "@path": "$.traits" }
  },
  "settings": {
    "api_user": "<EMARSYS-API-USER>",
    "api_password": "<EMARSYS-API-PASSWORD>"
  },
  "payload":
    {
      "properties": {
        "key_field": "3",
        "key_value": "tester@emarsys.com"
      },
      "traits": {
        "1": "Hans",
        "2": "Müller"
      }
    }
}'
```

### Example request to invoke performBatch()

Invoking an Action's performBatch() is nearly identical to [invoking the perform()](#example-request-to-invoke-perform) function except that the`payload` object will be an array of events rather than a single event object. In the example below a batch of 2 events is sent to the Emarsys performBatch() function.

```sh
curl --location --request POST 'http://localhost:3000/upsertContact' \
--header 'Content-Type: application/json' \
--data '{
  "mapping": {
    "key_field": { "@path": "$.properties.key_field" },
    "key_value": { "@path": "$.properties.key_value" },
    "write_field": { "@path": "$.traits" }
  },
  "settings": {
    "api_user": "<EMARSYS-API-USER>",
    "api_password": "<EMARSYS-API-PASSWORD>"
  },
  "payload":[
    {
      "properties": {
        "key_field": "3",
        "key_value": "tester@emarsys.com"
      },
      "traits": {
        "1": "Hans",
        "2": "Müller"
      }
    },
    {
      "properties": {
        "key_field": "3",
        "key_value": "another_tester@emarsys.com"
      },
      "traits": {
        "1": "James",
        "2": "Mills"
      }
    }]
}'
```

### Example request to invoke testAuthentication()

The testAuthentication() function is a function which is called in the Segment UI after a user provides Settings information in a Destination's Settings tab. The purpose of the testAuthentication() function is to verify that the authentication credentials provided by the customer are valid.

If the credentials are invalid the testAuthentication() function should throw an Error which will be displayed to the customer in the Segment UI.

The example below shows the HTTP POST request you would use to invoke the testAuthentication() function for the Emarsys Destination. This particular Destination doesn't use OAuth and instead has authentication fields in the `settings` object. The POST request should be sent to `http://localhost:3000/authentication`.

```sh
curl --location --request POST 'http://localhost:3000/authentication' \
--header 'Content-Type: application/json' \
--data '{
  "settings": {
    "api_user": "<EMARSYS-API-USER>",
    "api_password": "<EMARSYS-API-PASSWORD>"
  }
}'
```

If your Integration instead uses OAuth you will need to pass in an `oauth` object in the HTTP request:

```sh
curl --location --request POST 'http://localhost:3000/authentication' \
--header 'Content-Type: application/json' \
--data '{
  "oauth": {
    "access_token": "<OAUTH-ACCESS-TOKEN>"
  }
}'
```

### Example request to test createAudience() and getAudience()

You can test the createAudience and getAudience methods as well. Use the commands below as an example and populate the
settings according to the needs of your destination.

**createAudience**

```sh
curl --location 'http://localhost:3000/createAudience' \
--header 'Content-Type: application/json' \
--data '{
    "settings": {
        "createAudienceUrl": "http://localhost:4242"
    },
    "audienceSettings": {
        "advertiser_id": "abcxyz123"
    },
    "audienceName": "The Super Mario Brothers Super Audience"
}'
```

**getAudience**

```sh
curl --location 'http://localhost:3000/getAudience' \
--header 'Content-Type: application/json' \
--data '{
    "settings": {
        "getAudienceUrl": "http://localhost:4242/getAudience"
    },
    "audienceSettings": {
        "advertiser_id": "abcxyz123"
    },
    "externalId": 21
}'
```

## Unit Testing

When building a destination action, you should write unit and end-to-end tests to ensure your action is working as intended. Tests are automatically run on every commit in Github Actions. Pull requests that do not include relevant tests will not be approved.

Today, our unit tests behave more like <i>integration tests</i> in that you are not only testing the `perform` operation/unit, but also how events + mappings get transformed and validated.

Run tests for all cloud destinations with `yarn cloud test` or target a specific destination with the `--testPathPattern` flag:

```
yarn cloud test --testPathPattern=src/destinations/sendgrid
```

### Mocking HTTP Requests

While testing, we want to avoid hitting external APIs. We use `nock` to intercept requests before they hit the network.

### Examples

`Testing events + mapping`

```sh
import nock from 'nock'
import { createTestIntegration, StatsClient } from '@segment/actions-core'
import SendGrid from '../index'

const statsClient = {} as StatsClient
const tags = ['integration:actions-sendgrid']

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
        settings: { apiKey: SENDGRID_API_KEY },
        features: { my_feature: true },
        statsContext: { statsClient, tags }
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

## Snapshot Testing

Snapshot tests help developers understand how their changes affect the request body and the downstream tool. In `action-destinations`, they are automatically generated with both the `init` and `generate:action` CLI commands - the former creating destination-level snapshots and the latter creating action-level snapshots. These tests can be found in the `snapshot.test.ts` file under the `__tests__` folder.

The `snapshot.test.ts` file mocks an HTTP server using `nock`, and generates random test data (w/ `Chance`) based on the destination action's fields and corresponding data type. For each destination action, it creates two snapshot tests - one for all fields and another for just the required fields. To ensure deterministic tests, the `Chance` instance is instantiated with a fixed seed corresponding to the destination action name.

Once the actions under a new destination are complete, developers can run the following command to generate a snapshot file (`snapshot.test.ts.snap`) under `/__tests__/snapshots/`.

```
yarn jest --testPathPattern='./packages/destination-actions/src/destinations/<DESTINATION SLUG>' --updateSnapshot
```

Ensure your NODE_ENV environment variable is set to test.

```
export NODE_ENV=test
```

## Code Coverage

Code coverage is automatically collected upon completion of `yarn test`. Results may be inspected by examining the HTML report found at `coverage/lcov-report/index.html`, or directly in your IDE if _lcov_ is supported.

## Post Deployment Change Testing

An extra level of governance and oversight is required when making changes to an Integration which is already in use by customers. See [Submitting subsequent changes](../contributing.md) instructions for additional details.
