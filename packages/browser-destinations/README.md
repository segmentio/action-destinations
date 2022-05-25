# Browser Destinations

This package contains the implementations for browser destinations.

# Glossary

- Action: A method defined by the author of the destination that's linked to a Segment event.
- Plugin: A plugin is an action in AJS lingo. You can see the loaded plugins by typing `analytics.queue.plugins` in the browser's console.
- Subscription: A "way-in" into an action. For example: the `updateUser` action uses a subscription of the type `identify`. See the test section for more information.

## Developing

> NOTE: The shell commands mentioned below must be run with `browser-destinations` as root directory. Every command should be run using lerna.

### Actions CLI

See the [Actions CLI](https://github.com/segmentio/action-destinations#actions-cli) of the root directory of this repo to learn how to interact with the Actions CLI. Interacting with the actions CLI will allow you to create new destinations, actions and update your type definitions.

### Types

When updating the types inside of your actions remember to regenerate the types of your integration by running this command in the top level directory.

```
bin/run generate:types
```

### Manual testing

You can run a test webpage that makes every browser destination available for testing.
Steps include:

- 1. Run the web server

```
yarn dev
```

- 2. Visit the webserver: [http://localhost:9000](http://localhost:9000)
- 3. Set up a subscription in the settings box. A minimum of one subscription is required to load your destination. A valid subscription and settings look like this:

```
{
  "client_code": "segmentexchangepartn",
  "admin_number": "10",
  "version": "2.8.0",
  "cookie_domain": "localhost",
  "mbox_name": "target-global-mbox",
  "subscriptions": [
    {
      "partnerAction": "upsertProfile",
      "name": "Upsert Profile",
      "enabled": true,
      "subscribe": "type = \"identify\"",
      "mapping": {}
    }
  ]
}
```

- 4. Select a destination from the picker and click `load`

Notes:

- Be careful of matching the name and type of the subscriptions. The parser is case sensitive and also "" vs '' sensitive.
- The `partnerAction` key must have an action that matches its value.

### Automated tests

Running the test suite

```
yarn test
```

Running one file at the time

```
yarn jest src/destinations/PATH-TO-YOUR-DESTINATION/__tests__/index.test.ts
```

## Deploying

Coming Soon

## License

MIT License

Copyright (c) 2022 Segment

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
