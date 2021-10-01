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
npm login
yarn login
# Requires node 14.17, optionally: nvm use 14.17
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

## Testing

Refer [here](./packages/docs/testing.md) for more information about testing your destination actions.

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
