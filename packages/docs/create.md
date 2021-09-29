# Create a new Destination Action

This document describes in detail the steps necessary to create a new Actions-based Destination using the Segment CLI.

## Prerequisites

Before you begin, consider the following prerequisites.

### Security

The security of customers and partners is a top priority at Segment. Before you begin building, review the [Acceptable Use Policy](https://segment.com/legal/acceptable-use-policy/), and keep in mind:

- Follow a secure software-development lifecycle, which enables you to both create code that is safe for Segment customers and their end users, and maintain and raise the security of that code over time.
- If you or your code comes into contact with Segment customer or end-user data for any reason, protect it with commercially reasonable methods throughout the data lifecycle, including creating, handling, transporting, and destruction.
- If you suspect a security event, incident, or breach related to this project, contact [Segment Security](mailto:security@segment.com) for assistance with your investigation and communications.
- Practice modern and common-sense security for any scenario that is not explicitly stated.

### Configure your development environment

Fork the `segmentio/action-destinations` repository, connect to NPM and Yarn, and ensure a compatible version of Node is installed.

Run the test suite to ensure the environment is properly configured.

```sh
git clone https://github.com/segmentio/action-destinations.git
cd action-destinations
npm login
yarn login
# Requires node 14.17, optionally: nvm use 14.17
yarn --ignore-engines --ignore-optional
yarn bootstrap
yarn test
```

## Create a destination

Once you've configured your environment, you're ready to begin building your first destination. All commands, unless noted otherwise, should run from the root of the project folder. For example, `./action-destinations`

> Run `./bin/run --help` at any time to see a list of available commands.

### Scaffold the new destination

To begin, run `./bin/run init` to scaffold the project's directory structure, and create a minimal implementation of the new destination. The initialization sets the following information:

- Integration name
- Integration slug
- Authentication template (choose one of Custom Auth, Browser Destination, Basic Auth, OAuth2 Auth, or Minimal)

After completion, the directory structure of the new destination is created at `packages/destination-actions/src/destinations/<slug>`.

The `index.ts` file in this folder contains the beginnings of an Actions-based Destination. For example, a destination named `Test` using `Basic Auth` contains the following:

```js
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const destination: DestinationDefinition<Settings> = {
  name: 'Test',
  slug: 'actions-test',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'Username',
        description: 'Your Test username',
        type: 'string',
        required: true
      },
      password: {
        label: 'password',
        description: 'Your Test password.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  extendRequest({ settings }) {
    return {
      username: settings.username,
      password: settings.password
    }
  },

  actions: {}
}

export default destination
```

Notice the `name` and `slug` properties, the `authentication` object, an `extendRequest` function that returns the username and password from settings, and an empty `actions` object.

With this minimal configuration, the destination can connect to the Segment App's user interface, and collect authentication fields. The destination does not do anything at this point, because no Actions are defined.

> The `testAuthentication` function verifies the user's credentials against a service. For testing, enter `return true` in this function to continue development.

## Actions

Actions define what the destination can do. They instruct Segment how to send data to your destination API. For example, consider this "Post to Channel" action from a Slack destination:

```js

const destination = {
  // ...other properties
  actions: {
    postToChannel: {
      // the human-friendly display name of the action
      title: 'Post to Channel',

      // the human-friendly description of the action. supports markdown
      description: 'Post a message to a Slack channel',

      // whether or not this should appear in the Quick Setup
      recommended: true,

      // fql query to use for the subscription initially
      // required if using `recommended: true`
      defaultSubscription: 'type = "track"'

      // the set of fields that are specific to this action
      fields: {
        webhookUrl: {
          label: 'Webhook URL',
          description: 'Slack webhook URL.',
          type: 'string',
          format: 'uri',
          required: true
        },
        text: {
          label: 'Message',
          description: "The text message to post to Slack. You can use [Slack's formatting syntax.](https://api.slack.com/reference/surfaces/formatting)",
          type: 'string',
          required: true
        }
      },

      // the final logic and request to send data to the destination's API
      perform: (request, { settings, payload }) => {
        return request.post(payload.webhookUrl, {
          responseType: 'text',
          json: {
            text: payload.text
          }
        })
      }
    }
  }
}
```
