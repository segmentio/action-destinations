<p align="center"><a href="https://segment.com"><img src="https://github-production-user-asset-6210df.s3.amazonaws.com/316711/254403783-df7b9cdd-1e45-48a8-a255-e1cc087e2196.svg" width="100"/></a></p>

# Action Destinations

Action Destinations are the new way to build streaming destinations on Segment.

Action Destinations were [launched in December 2021](https://segment.com/blog/introducing-destination-actions/) to enable customers with a customizable framework to map Segment event sources to their favorite 3rd party tools like Google Analytics.

This repository contains the Action Destination Definitions as well as a CLI to generate the scaffolding for new destinations and run unit tests. If you'd like to contribute, please review the [Contributing Guide](./CONTRIBUTING.md).

To begin, follow the instructions in Get Started below.

For more detailed instruction, see the following READMEs:

- [Contributing Document](./CONTRIBUTING.md)
- [Create a Destination Action](./docs/create.md)
- [Build & Test Cloud Destinations](./docs/testing.md)
- [Troubleshooting](./docs/testing.md)
- [Authentication](./docs/authentication.md)
- [Mapping Kit](./packages/core/src/mapping-kit/README.md)
- [Destination Kit](./packages/core/src/destination-kit/README.md)
- [Error Handling](./docs/error-handling.md)

## Table of Contents:

- [Get Started](#get-started)
- [Actions CLI](#actions-cli)
- [Example Destination](#example-destination)
- [Input Fields](#input-fields)
- [Default Values](#default-values)
- [Presets](#presets)
- [perform function](#the-perform-function)
- [Batching Requests](#batching-requests)
- [Parsing MultiStatus Responses](#parsing-multistatus-responses)
- [Action Hooks](#action-hooks)
- [HTTP Requests](#http-requests)
- [Support](#support)

## Get started

### Local development

This is a monorepo with multiple packages leveraging:

- [`lerna`](https://github.com/lerna/lerna) for publishing
- [`nx`](https://nx.dev) for dependency-tree aware building, linting, testing, and caching (migration away from `lerna` in progress!).
- [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces) for package symlinking and hoisting.

Structure:

- `packages/ajv-human-errors` - a wrapper around [AJV](https://ajv.js.org/) errors to produce more friendly validation messages
- `packages/browser-destinations` - destination definitions that run on device via Analytics 2.0
- `packages/cli` - a set of command line tools for interacting with the repo
- `packages/core` - the core runtime engine for actions, including mapping-kit transforms
- `packages/destinations-actions` - destination definitions and their actions
- `packages/destinations-subscriptions` - validates events against an action's subscription AST

### Getting set up

You'll need to have some tools installed locally to build and test action destinations.

- Yarn 1.x
- Node 18.17 (latest LTS, we recommand using [`nvm`](https://github.com/nvm-sh/nvm) for managing Node versions)

If you are a Segment employee you can directly `git clone` the repository locally. Otherwise you'll want to fork this repository for your organization to submit Pull Requests against the main Segment repository. Once you've got a fork, you can `git clone` that locally.

```sh
# Clone the repo locally
git clone <your fork or https://github.com/segmentio/action-destinations.git>
cd action-destinations

npm login
yarn login

# Requires node 18.17.1, optionally: nvm use 18.17.1
yarn --ignore-optional
yarn install
yarn build

# Run unit tests to ensure things are working! For partners who don't have access to internal packages, you can run:
yarn test-partners

# For segment employees, you can run:
yarn test

# to reset all caches and rebuild again
yarn clean-build
```

### Actions CLI

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

For instructions on how to create a new integration, see the [Create a new Destination Action](./docs/create.md) docs.

#### Troubleshooting CLI

If a CLI command fails to work properly, run the command with `DEBUG=*` at the beginning (e.g. `DEBUG=* ./bin/run serve`). This will produce a verbose debugging output, providing hints as to why something isn't working as expected. All of the CLI commands are also in the `./packages/cli/src/commands` directory if you need to inspect them further.

### Testing

Refer [here](./docs/testing.md) for more information about testing your destination actions.

## Debugging

Pass the Node flag `--inspect` when you run the local server, and then you can attach a debugger from your IDE. The `serve` command will pass any extra args/flags to the underlying Node process.

### Configuring

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

## Example Destination

### Local File Structure

In your destination’s folder, you should see this general structure. The `index.ts` file (with the asterisk) is the entry point to your destination - the CLI expects you to export a destination definition there.

```
$ tree packages/destination-actions/src/destinations/slack
packages/destination-actions/src/destinations/slack
├── generated-types.ts
├── index.ts (*)
└── postToChannel
    ├── generated-types.ts
    └── index.ts
```

### Local Destination Definition

The main definition of your Destination will look something like this, and is what your index.ts should export as the default export:

```js
const destination = {
  name: 'Example Destination',

  // a human-friendly description that gets displayed to users. supports markdown
  description: '',

  // see "Authentication" section below
  authentication: {},

  // see "HTTP Requests" section below
  extendRequest: () => {}

  // see "Actions" section below
  actions: {}
}

export default destination
```

## Input Fields

For each action or authentication scheme you can define a collection of inputs as fields. Input fields are what users see in the Action Editor to configure how data gets sent to the destination or what data is needed for authentication. These fields (for the action only) are able to accept input from the Segment event.

Input fields have various properties that help define how they are rendered, how their values are parsed and more. Here’s an example:

```js
const destination = {
  // ...other properties
  actions: {
    postToChannel: {
      // ...
      fields: {
        webhookUrl: {
          label: 'Webhook URL',
          description: 'Slack webhook URL.',
          type: 'string',
          required: true
        },
        text: {
          label: 'Message',
          description: 'The text message to post to Slack',
          type: 'string',
          required: true
        }
      }
    }
  }
}
```

### Input Field Interface

Here's the full interface that input fields allow:

```ts
interface InputField {
  /** A short, human-friendly label for the field */
  label: string

  /** A human-friendly description of the field */
  description: string

  /** The data type for the field */
  type: 'string' | 'text' | 'number' | 'integer' | 'datetime' | 'boolean' | 'password' | 'object'

  /** Whether null is allowed or not */
  allowNull?: boolean

  /** Whether or not the field accepts multiple values (an array of `type`) */
  multiple?: boolean

  /** An optional default value for the field */
  default?: string | number | boolean | object | Directive

  /** A placeholder display value that suggests what to input */
  placeholder?: string

  /** Whether or not the field supports dynamically fetching options */
  dynamic?: boolean

  /** Whether or not the field is required */
  required?: boolean | DependsOnConditions

  /**
   * Optional definition for the properties of `type: 'object'` fields
   * (also arrays of objects when using `multiple: true`)
   * Note: this part of the schema is not persisted outside the code
   * but is used for validation and typedefs
   */
  properties?: Record<string, InputField>

  /**
   * Format option to specify more nuanced 'string' types
   * @see {@link https://github.com/ajv-validator/ajv/tree/v6#formats}
   */
  format?:
    | 'date' // full-date according to RFC3339.
    | 'time' // time with optional time-zone.
    | 'date-time' // date-time from the same source (time-zone is mandatory). date, time and date-time validate ranges in full mode and only regexp in fast mode (see options).
    | 'uri' // full URI.
    | 'uri-reference' // URI reference, including full and relative URIs.
    | 'uri-template' // URI template according to RFC6570
    | 'email' // email address.
    | 'hostname' // host name according to RFC1034.
    | 'ipv4' // IP address v4.
    | 'ipv6' // IP address v6.
    | 'regex' // tests whether a string is a valid regular expression by passing it to RegExp constructor.
    | 'uuid' // Universally Unique IDentifier according to RFC4122.
    | 'password' // hint to the UI to hide/obfuscate input strings (applied automatically when using `type: 'password'`
    | 'text' // longer strings (applied automatically when using `type: 'text'`
}
```

## Default Values

You can set default values for fields. These defaults are not used at run-time, however. These defaults **pre-populate the initial value of the field when users first set up an action**.

Default values can be literal values that match the `type` of the field (e.g. a literal string: ` "``hello``" `) or they can be mapping-kit directives just like the values from Segment’s rich input in the app. It’s likely that you’ll want to use directives to the default value. Here are some examples:

```js
const destination = {
  // ...other properties
  actions: {
    doSomething: {
      // ...
      fields: {
        name: {
          label: 'Name',
          description: "The person's name",
          type: 'string',
          default: { '@path': '$.traits.name' },
          required: true
        },
        email: {
          label: 'Email',
          description: "The person's email address",
          type: 'string',
          default: { '@path': '$.properties.email_address' }
        },
        // an object field example. Defaults should be specified on the top level.
        value: {
          label: 'Conversion Value',
          description: 'The monetary value for a conversion. This is an object with shape: {"currencyCode": USD", "amount": "100"}'
          type: 'object'
          default: {
            currencyCode: { '@path': '$.properties.currency' },
            amount: { '@path': '$.properties.revenue' }
          },
          properties: {
            currencyCode: {
              label: 'Currency Code',
              type: 'string',
              required: true,
              description: 'ISO format'
            },
            amount: {
              label: 'Amount',
              type: 'string',
              required: true,
              description: 'Value of the conversion in decimal string. Can be dynamically set up or have a fixed value.'
            }
          }
          }
        }
      }
    }
  }
}
```

In addition to default values for input fields, you can also specify the defaultSubscription for a given action – this is the FQL query that will be automatically populated when a customer configures a new subscription triggering a given action.

## Required Fields

You may configure a field to either be always required, not required, or conditionally required. Validation for required fields is performed both when a user is configuring a mapping in the UI and when an event payload is delivered through a `perform` block.

**An example of each possible value for `required`**

```js
const destination = {
  actions: {
    readmeAction: {
      fields: {
        operation: {
          label: 'An operation for the readme action',
          required: true // This field is always required and any payloads omitting it will fail
        },
        creationName: {
          label: "The name of the resource to create, required when operation = 'create'",
          required: {
            // This field is required only when the 'operation' field has the value 'create'
            match: 'all',
            conditions: [
              {
                fieldKey: 'operation',
                operator: 'is',
                value: 'create'
              }
            ]
          }
        },
        email: {
          label: 'The customer email',
          required: false // This field is not required. This is the same as not including the 'required' property at all
        },
        userIdentifiers: {
          phone: {
            label: 'The customer phone number',
            required: {
              // If email is not provided then a phone number is required
              conditions: [{ fieldKey: 'email', operator: 'is', value: undefined }]
            }
          },
          countryCode: {
            label: 'The country code for the customer phone number',
            required: {
              // If a userIdentifiers.phone is provided then the country code is also required
              conditions: [
                {
                  fieldKey: 'userIdentifiers.phone', // Dot notation may be used to address object fields.
                  operator: 'is_not',
                  value: undefined
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

**Examples of valid and invalid payloads for the fields above**

```json
// This payload is valid since the only required field, 'operation', is defined.
{
  "operation": "update",
  "email": "read@me.com"
}
```

```json
// This payload is invalid since 'creationName' is required because 'operation' is 'create'
{
  "operation": "create",
  "email": "read@me.com"
}
// This error will be thrown:
"message": "The root value is missing the required field 'creationName'. The root value must match \"then\" schema."
```

```json
// This payload is valid since the two required fields, 'operation' and 'creationName' are defined.
{
  "operation": "create",
  "creationName": "readme",
  "email": "read@me.com"
}
```

```json
// This payload is invalid since 'phone' is required when 'email' is missing.
{
  "operation": "update",
}
// This error will be thrown:
"message": "The root value is missing the required field 'phone'. The root value must match \"then\" schema."
```

```json
// This payload is invalid since 'countryCode' is required when 'phone' is defined
{
  "operation": "update",
  "userIdentifiers": { "phone": "619-555-5555" }
}
// This error will be thrown:
"message": "The root value is missing the required field 'countryCode'. The root value must match \"then\" schema."
```

```json
// This payload is valid since all conditionally required fields are included
{
  "operation": "update",
  "userIdentifiers": {
    "phone": "619-555-5555",
    "countryCode": "+1"
  }
}
```

## Dynamic Fields

You can setup a field which dynamically fetches inputs from your destination. These dynamic fields can be used to populate a dropdown menu of options for your users to select.

```js
const destination = {
  // ...other properties
  actions: {
    doSomething: {
      // ...
      fields: {
        objectName: {
          label: 'Name',
          description: "The name of the object to update.",
          type: 'string',
          required: true,
          dynamic: true
        }
      },
      dynamicFields: {
        objectName = async (): Promise<DynamicFieldResponse> => {
          try {
            const result = await this.request<ObjectsResponseData>(`http://<destination>/objects`,
            {
              method: 'get',
              skipResponseCloning: true // This is useful if you expect a large response.
            })

            const fields = result.data.objects.filter((field) => {
              return field.createable === true
            })

            const choices = fields.map((field) => {
              return { value: field.name, label: field.label }
            })

            return {
              choices: choices,
              nextPage: '2'
            }
          } catch (err) {
            return {
              choices: [],
              nextPage: '',
              error: {
                message: (err as ResponseError).response?.data[0]?.message ?? 'Unknown error',
                code: (err as ResponseError).response?.data[0]?.errorCode ?? 'Unknown error'
              }
            }
          }
  }
      }
    }
  }
}
```

## Conditional Fields

Conditional fields enable a field only when a predefined list of conditions are met while the user steps through the mapping editor. This is useful when showing a field becomes unnecessary based on the value of some other field.

For example, in the Salesforce destination the 'Bulk Upsert External ID' field is only relevant when the user has selected 'Operation: Upsert' and 'Enable Batching: True'. In all other cases the field will be hidden to streamline UX while setting up the mapping.

To define a conditional field, the `InputField` should implement the `depends_on` property. This property lives in destination-kit and the definition can be found here: [`packages/core/src/destination-kit/types.ts`](https://github.com/segmentio/action-destinations/blame/854a9e154547a54a7323dc3d4bf95bc31d31433a/packages/core/src/destination-kit/types.ts).

The above Salesforce use case is defined like this:

```js
export const bulkUpsertExternalId: InputField = {
  // other properties skipped for brevity ...
  depends_on: {
    match: 'all', // match is optional and can be either 'any' or 'all'. If left undefiend it defaults to matching all conditions.
    conditions: [
      {
        fieldKey: 'operation', // field keys must match some other field in the same action
        operator: 'is',
        value: 'upsert'
      },
      {
        fieldKey: 'enable_batching',
        operator: 'is',
        value: true
      }
    ]
  }
}
```

Lists of values can also be included as match conditions. For example:

```js
export const recordMatcherOperator: InputField = {
  // ...
  depends_on: {
    // This is interpreted as "show recordMatcherOperator if operation is (update or upsert or delete)"
    conditions: [
      {
        fieldKey: 'operation',
        operator: 'is',
        value: ['update', 'upsert', 'delete']
      }
    ]
  }
}
```

The value can be undefined, which allows matching against empty fields or fields which contain any value. For example:

```js
export const name: InputField = {
  // ...
  depends_on: {
    match: 'all',
    // The name field will be shown only if conversionRuleId is not empty.
    conditions: [
      {
        fieldKey: 'conversionRuleId',
        operator: 'is_not',
        value: undefined
      }
    ]
  }
}
```

## Presets

Presets are pre-built use cases to enable customers to get started quickly with an action destination. They include everything needed to generate a valid subscription.

There are two types of Presets: `automatic` and `specificEvent`.

Automatic presets generate subscriptions automatically when an action destination is connected to a _non-Engage_ source. Automatic presets are also available for the customer to choose to generate a subscription at any point in the destination's lifecycle. If you are not sure which type of preset to choose, this is probably the right type.

[Experimental] SpecificEvent presets are meant to be used with destinations connected to Segment Engage Sources. A subscription will be created from the preset when a _specific action_ is taken by the customer, as specified by the `eventSlug`. If you think your destination should include a specific event preset, please reach out to us.

```js
const destination = {
  // ...other properties
  presets: [
    // automatic preset
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    },
    // specific event preset
    {
      name: 'Associated Entity Added',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'specificEvent'
      slug: 'warehouse_entity_added_track'
    },
  ],
}
```

## The `perform` function

The `perform` function defines what the action actually does. All logic and request handling happens here. Every action MUST have a `perform` function defined.

By the time the actions runtime invokes your action’s perform, payloads have already been resolved based on the customer’s configuration, validated against the schema, and can be expected to match the types provided in your `perform` function.

The `perform` method accepts two arguments, (1) the request client instance (extended with your destination's `extendRequest`, and (2) the data bundle. The data bundle includes the following fields:

- `payload` - The transformed input data, based on `mapping` + `event` (or `events` if batched). You’ll get compile-time type-safety for how you access anything in the `data.payload`.
- `settings` - The global destination settings.
- `auth` - The data needed in OAuth requests. This is useful if fetching an updated OAuth `access_token` using a `refresh_token`. The `refresh_token` is available in `auth.refreshToken`.
- `features` - The features available in the request based on the customer's sourceID. Features can only be enabled and/or used by internal Twilio/Segment employees. Features cannot be used for Partner builds.
- `statsContext` - An object, containing a `statsClient` and `tags`. Stats can only be used by internal Twilio/Segment employees. Stats cannot be used for Partner builds.
- `logger` - Logger can only be used by internal Twilio/Segment employees. Logger cannot be used for Partner builds.
- `engageDestinationCache` - EngageDestinationCache can only be used by internal Twilio/Segment employees. EngageDestinationCache should not be used for Partner builds.
- `transactionContext` - An object, containing transaction variables and a method to update transaction variables which are required for few segment developed actions. Transaction Context cannot be used for Partner builds.
- `stateContext` - An object, containing context variables and a method to get and set context variables which are required for few segment developed actions. State Context cannot be used for Partner builds.
- `subscriptionMetadata` - an object, containing variables which identify the instance of a Destination and Action as well as other metadata. Subscription Metadata cannot be used for Partner builds.

A basic example:

```js
const destination = {
  actions: {
    someAction: {
      // ...
      fields: {
        greeting: {
          label: 'Greeting',
          description: 'The text message to send',
          type: 'string',
          required: true
        }
      },
      // `perform` takes two arguments:
      // 1. the request client instance (extended with your destination's `extendRequest`
      // 2. the data bundle (destructured below)
      perform: (request, { payload, settings, auth, features, statsContext }) => {
        return request('https://example.com', {
          headers: { Authorization: `Bearer ${data.settings.api_key}` },
          json: data.payload
        })
      }
    }
  }
}
```

The perform method will be invoked once for every event subscription that triggers the action. If you need to support batching, we’ve begun rolling out experimental support for defining a `performBatch` function. Continue reading to learn about how that works.

## Batching Requests

Sometimes your customers have a lot of events, and your API supports a more efficient way to receive and process those large sets of data. We have early, experimental support for batching.

You can implement an _additional_ perform method named `performBatch` in the action definition, alongside the `perform` method. The method signature looks like identical to `perform` except the `payload` is an array of data, where each item is an object matching your action’s field schema:

```js
function performBatch(request, { settings, payload }) {
  return request('https://example.com/batch', {
    // `payload` is an array of objects, each matching your action's field definition
    json: payload
  })
}
```

All actions where a `performBatch` method is defined will automatically include an `enable_batching` input field for users. This field is a boolean switch that allows users to toggle batching functionality. Builders can override the automatically included field by explicitly defining a field named `enable_batching` with type boolean in the `fields` section of the `ActionDefinition`. This may be useful if the builder wants to specify custom labels or descriptions or set a default value.

```js
const action: ActionDefinition<Settings, Payload> = {
  title: 'Account',
  description: 'Represents an individual account, which is an organization or person involved with your business.',
  defaultSubscription: 'type = "group"',
  fields: {
    enable_batching: {
      type: 'boolean',
      label: 'Use Salesforce Bulk API',
      description:
        'When enabled, the action will use the Salesforce Bulk API to perform the operation. Not compatible with the insert operation.',
      required: true,
      default: false
    }
  },
  performBatch: async (request, { settings, payload }) => { ... }
}
```

This will give customers the ability to opt-in to batching (there may be trade-offs they need to consider before opting in). Each customer subscription will be given the ability to Enable Batching.

Keep in mind a few important things about how batching works:

- Batching can add latency while Segment accumulates events in batches internally. This can be up to a minute, currently, but this is subject to change at any time. Latency is lower when you send a higher volume of events.
- Batches may have to up 1,000 events, currently. This, too, is subject to change.
- Batch sizes are not guaranteed. Due to the way that batches are accumulated internally, you may see smaller batch sizes than you expect when sending low rates of events.

Additionally, you’ll need to coordinate with Segment’s R&D team for the time being. Please reach out to us in your dedicated Slack channel!

## Parsing MultiStatus Responses

When a batch request to a destination returns a 207 MultiStatus response, the `performBatch` method will typically receive an array of responses, indicating the status of each event in the batch. The Actions Framework provides a `MultiStatusResponse` class to help you parse these responses to report a more granular success or failure status for each event.

A detailed example of how to use the `MultiStatusResponse` class can be found in the [MultiStatus Documentation](./docs/multistatus.md).

## Action Hooks

Hooks allow builders to perform requests against a destination at certain points in the lifecycle of a mapping. Values can then be persisted from that request to be used later on in the action's `perform` method.

At the moment two hooks are available: `onMappingSave` and `retlOnMappingSave`:

- `onMappingSave`: This hook appears in the MappingEditor page as a separate step. Users fill in the defined input fields and the code in the `performHook` block is triggered when the user saves their mapping.
- `retlOnMappingSave`: This hook appears only for destinations connected to a RETL warehouse source. It is otherwise the same as the `onMappingSave` hook.

**Inputs**

Builders may define a set of `inputFields` that are used when performing the request to the destination.

**`performHook`**

Similar to the `perform` method, the `performHook` method allows builders to trigger a request to the destination whenever the criteria for that hook to be triggered is met. This method uses the `inputFields` defined as request parameters.

**Outputs**

Builders define the shape of the hook output with the `outputTypes` property. Successful returns from `performHook` should match the keys defined here. These values are then saved on a per-mapping basis, and can be used in the `perform` or `performBatch` methods when events are sent through the mapping. Outputs can be referenced in the `perform` block with `data.hookOutputs?.<hookType>?.<property>`

### Example (LinkedIn Conversions API)

This example has been shorted for brevity. The full code can be seen in the LinkedIn Conversions API 'streamConversion' action.

```js
const action: ActionDefinition<Settings, Payload, undefined, HookBundle> = {
  title: 'Stream Conversion Event',
  ...
  hooks: {
        'onMappingSave': {
      type: 'onMappingSave',
      label: 'Create a Conversion Rule',
      description:
        'When saving this mapping, we will create a conversion rule in LinkedIn using the fields you provided.',
      inputFields: {
        name: {
          type: 'string',
          label: 'Name',
          description: 'The name of the conversion rule.',
          required: true
        },
        conversionType: {
          type: 'string',
          label: 'Conversion Type',
          description: 'The type of conversion rule.',
          required: true
        },
      },
      outputTypes: {
        id: {
          type: 'string',
          label: 'ID',
          description: 'The ID of the conversion rule.',
          required: true
        },
        name: {
          type: 'string',
          label: 'Name',
          description: 'The name of the conversion rule.',
          required: true
        },
      },
      performHook: async (request, { hookInputs }) => {
        const { data } =
          await request<ConversionRuleCreationResponse>
          ('https://api.linkedin.com/rest/conversions', {
          method: 'post',
          json: {
            name: hookInputs.name,
            type: hookInputs.conversionType
          }
        })

        return {
          successMessage:
          `Conversion rule ${data.id} created successfully!`,
          savedData: {
            id: data.id,
            name: data.name,
          }
        }
      }
    }
  },
    perform: (request, data) => {
    return request('https://example.com', {
      method: 'post',
      json: {
        conversion: data.hookOutputs?.onMappingSave?.id,
        name: data.hookOutputs?.onMappingSave?.name
      }
    })
  }
  }
```

## Audience Support (Pilot)

In order to support audience destinations, we've introduced a type that extends regular destinations:

```js
const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  // ...other properties
  audienceFields: {
    audienceId: {
      label: 'An audience id required by the destination',
      description: 'An audience id required by the destination',
      type: 'string',
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule
      full_audience_sync: true // If true, we send the entire audience. If false, we just send the delta.
    }
  },
  // These are optional and only needed if you need to create an audience before sending events/users.
  // Create an audience on the destination side
  async createAudience(request, { settings, audienceSettings, audienceName }) {
    const response = await request(YOUR_URL, {
      method: 'POST',
      json: {
        new_audience_name: audienceName,
        some_audience_specific_id: audienceSettings.audienceId // As defined in audienceFields
      }
    })
    const jsonOutput = await response.json()
    // Segment will save this externalId for subsequent calls
    return {
      externalId: jsonOutput['my_audience_id']
    }
  },
  // Right now, this serves mostly as a check to ensure the audience still exists in the destination
  async getAudience(request, { settings, audienceSettings, externalId }) {
    const response = await request(YOUR_URL, {
      method: 'POST',
      json: {
        my_audience_id: externalId
      }
    })
    const jsonOutput = await response.json()
    return {
      externalId: jsonOutput['my_audience_id']
    }
  }
}
```

**Other considerations for audience support:**

- It is highly recommended to implement a `performBatch` function in your actions implementation.
- You should implement actions specific to audiences such as adding and removing a user

## HTTP Requests

Today, there is only one way to make HTTP requests in a destination: **Manual HTTP Requests**.

You can use the `request` object to make requests and curate responses. This `request` is injected as the first argument in all operation functions in the definition (for example, in an action’s `perform` function).

In addition to making manual HTTP requests, you can use the `extendRequest` helper to reduce boilerplate across actions and authentication operations in the definition:

```js
const destination = {
  // ...other properties
  extendRequest: (request, { settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.apiKey}` }
    }
  },

  actions: {
    doAThing: {
      // ...other properties
      perform: (request, data) => {
        // this request will have the Authorization header
        return request('https://example.com/api/me.json', {
          method: 'post',
          json: data
        })
      }
    }
  }
}
```

### HTTP Request Options

The request client is a thin wrapper around the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), made available both in Node (via `node-fetch`) and in the browser (with the `whatwg-fetch` ponyfill as needed).

Both the `request(url, options)` function and the `extendRequest` return value also support all of the Fetch API and some additional `options`:

- `method`: HTTP method, default is `GET`.
- `headers`: HTTP request headers object as a plain object `{ foo: 1, bar: true }`.
- `json`: shortcut to automatically JSON.stringify into the request body and set the `content-type` header to `application/json`.
- `password`: Basic authentication password field. Will automatically get base64 encoded with the username and added to the request headers: `Authorization: Basic <username:password>`
- `searchParams`: URLSearchParams or a plain object that you want included in request url’s query string.
- `throwHttpErrors`: whether or not the request should throw an HTTPError for non-2xx responses. Default is `true`.
- `timeout`: Time in milliseconds when a request should be aborted. Default is `10000`.
- `username`: Basic authentication username field. Will automatically get base64 encoded with the password and added to the request headers: `Authorization: Basic <username:password>`

```js
const response = await request('https://example.com', {
  method: 'post',
  headers: { 'content-type': 'application/json' },
  json: { hello: 'world' },
  searchParams: { foo: 1, bar: true },
  username: 'my',
  password: 'secret',
  timeout: 10000,
  throwHttpErrors: true
})
```

### Differences from the Fetch API

There are a few subtle differences from the Fetch API which are meant to limit the interface to be a bit more predictable. We may consider loosening this to match the complete spec.

- the `url` argument can only be a string instead of also accepting a `Request` object or a `URL` object.
- `headers` can only be a plain object instead of also accepting a `Headers` object.
- some options and behaviors are not applicable to Node.js and will be ignored by `node-fetch`. See this list of [known differences](https://github.com/node-fetch/node-fetch/blob/1780f5ae89107ded4f232f43219ab0e548b0647c/docs/v2-LIMITS.md).
- `method` will automatically get upcased for consistency.

## Automatic Hashing Detection with `processHashing`

Our popular segment Adtect destinations support [automatic hash detection](https://segment.com/docs/connections/destinations/#hashing) of personally identifyable information (PII). If your destination hashes PII data, we recommend you use the `processHashing` utility instead of `createHash` from `crypto` module.
This utility automatically detects if a value is already hashed. It will only apply a hash if the value appears to be unhashed.

The `processHashing` utility supports `md5`, `sha1`,`sha224`,`sha256`,`sha384` and`sha512` hashing algorithms. It can output digests in `hex` or `base64` format.

**Note**: For empty or whitespace-only strings, the `processHashing` outputs an empty string instead of throwing an error like `createHash` hash module.

### Example 1: Hashing an Email Address

```
  import { processHashing } from 'destination-actions/lib/hashing-utils'

  const email = ' Person@email.com '
  const hashedEmail = processHashing(
    email,
    'sha256',
    'hex',
    (value) => value.trim().toLowerCase()
  )

  console.log(hashedEmail) // hashed string
```

### Example 2: Hashing a Phone Number

```
  const phone = '+1(706)-767-5127'
  const normalizePhone = (value: string) => value.replace(/[^0-9]/g, '')

  const hashedPhone = processHashing(
    phone,
    'sha256',
    'hex',
    normalizePhone
  )

  console.log(hashedPhone) // hashed string
```

**Requesting Additional Algorithms**
To request additional hash algorithms, contact partner-support@segment.com.

## Support

For any issues, please contact our support team at partner-support@segment.com.

## License

MIT License

Copyright (c) 2025 Segment

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

```

```
