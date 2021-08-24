# Action Destinations

Action Destinations are a way to build streaming destinations on Segment.

## Local Development

This project is a monorepo with multiple packages using Yarn Workspaces:

- `packages/cli` - a set of command line tools for interacting with the repo
- `packages/core` - the core runtime engine for actions, including mapping-kit transforms
- `packages/destinations-actions` - destination definitions and their actions
- `packages/destinations-subscriptions` - validates events against an action's subscription AST

```
git clone https://github.com/segmentio/action-destinations.git
cd action-destinations
yarn --ignore-engines --ignore-optional
yarn bootstrap
yarn test
```

## Test Actions Locally

To test actions locally, you send a curl request. For example:

```sh
curl --request POST \
  --url http://localhost:3000/actions/5f7dd8e302173ff732db5cc4 \
  --header 'content-type: application/cloudevents-batch+json' \
  --data '[
  {
    "id": "dkjfksldfjiuhfenjk",
    "source": "some-source",
    "destination": "slack",
    "data": {
      "channel": "server",
      "context": {
        "library": {
          "name": "unknown",
          "version": "unknown"
        }
      },
      "event": "Example Event",
      "integrations": {},
      "messageId": "api-1iI59hvBEtckNicjbfqG7VdjRw2",
      "projectId": "29qHxXL9muph5R19vwAnDP",
      "properties": {
        "text": "Hello, from dev :blobcatwave:!"
      },
      "receivedAt": "2020-10-01T19:55:15.068Z",
      "timestamp": "2020-10-01T19:55:15.068Z",
      "type": "track",
      "userId": "sloth@segment.com",
      "version": 2
    },
    "settings": {
      "subscription": {
        "mapping": {
          "channel": "test-channel",
          "url": "https://hooks.slack.com/services/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",
          "text": {
            "@template": "Event = {{event}}, properties.text = {{properties.text}}"
          }
        },
        "partnerAction": "postToChannel",
        "subscribe": "type = \"track\""
      }
    }
  }
]'
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
