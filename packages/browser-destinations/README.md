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

You can use our Action Tester environment to test your browser actions:

```
./bin/run serve --directory ./packages/browser-destinations/destinations --browser
```

This will give you an option to pick a destination to work on, and then opens the action tester. You can also debug the code from Visual Studio Code. Goto VSCode Debug Tab, and select "Launch Action Tester Web" from the "RUN AND DEBUG" dropdown ( make sure you ran the above command first ). This will launch a new instance of Google Chrome, and allow you to run your code in debug mode.

### Automated tests

Running the test suite

```
yarn test
```

Running one file at the time

```
yarn jest destinations/PATH-TO-YOUR-DESTINATION/src/__tests__/index.test.ts
```

## Deploying

Coming Soon

## License

MIT License

Copyright (c) 2023 Segment

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
