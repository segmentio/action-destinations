# Browser Destinations Integration Tests

These are for tests that target the final, webpacked output of browser-destinations, and can ideally be run in multiple browsers via a device farm like Sauce Labs.

These tests are meant to run in real browsers and issues that might be missed in the package unit tests, which run in a node environment.

Browser targets:

- latest verison of chrome
- latest version of safari
- latest version of firefox
- iOS 13 (older version of safari)

## Running tests

1. Build dependencies and start local server

```sh
yarn browser-destinations:build &&
yarn start-destination-server
```

2. Run tests locally

```sh
yarn run test:local
```

3. Run tests on Sauce Labs

```sh
SAUCE_USERNAME=??? SAUCE_ACCESS_KEY=??? yarn run test:sauce
```
