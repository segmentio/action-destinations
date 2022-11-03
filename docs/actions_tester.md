# Actions Tester

This guide will cover how to use the actions tester interface while developing your actions based destination.

### Prerequesites

Before beginning this guide, it is recommended to have followed the steps in the [Creation Flow](./create.md)

You will also need a valid account on the Segment app (free tier is fine) which can be created at https://app.segment.com

### Getting started

Getting started with actions tester is quite easy. For cloud action destinations, simply type the following inside the folder where you have cloned the actions-destinations repository:

`./bin/run serve`

For web action destinations, use the following command instead:

`./bin/run serve --directory ./packages/browser-destinations/src/destinations --browser`

You may either select your new action destination via the command line menu, or optionally pass it via enviornment variable to skip that step.

The command will return some text which includes a URL to the action tester UI. Click or copy/paste this text into a browser to get started. If you are not already logged into Segment you will need to log in using your app account credentials.

### Using Actions Tester

The Actions tester UI is split into 3 main areas:

- The Segment 'Test Event':

  - You can think of this as the 'incoming' data sent from the customer's 'source' through the Segment data plane, and eventually to your actions destination.

- Settings / Mappings:

  - The middle pane provides a 'toggleable' area that allows you to switch between what the Segment UI will look like for your destination's setup. Note that the layout itself, including the order here may not be 100% representative of how your destination will be rendered in the UI, however this serves as a useful playground for determining how mappings are configurable by the user, and what impact your choices in the field definitions have on the user experience.
  - The settings pane shows a representation of the 'global' settings available for your destination
  - The mappings pane (which mappings are shown is determed by the dropdown above) shows a representation of the individual mappings (as well as any defaults you have specified) for a given action.

- Mappings output:
  - The final pane is a JSON representation of the 'test event' data after it has gone through the mapping process. This is updated in 'realtime' as changes are made to the test even or the mappings. This data is representative of what will be provided on the `payload` property of the perform method at execution time.

### Editing field definitions

While working on your destination's definitions in typescript, if you have action tester running locally, the tester UI will update with settings/mapping field changes without the need for the local server component to be restarted. Note that there is a slight delay to account for the local bundling process.

#### Testing your action

Actions tester allows for a simulated test of the action environment. Clicking the 'test' button in the lower right corner will trigger the `perform` method of your action and pass it the `settings` and `payload` generated in the testing UI. This allows you to debug the perform method, as well as validating any responses from your API in the resulting output panel.

Currently the output panel behaves in two 'modes'. The first is `immediate` failures. If your api call could not be completed due to invalid url, credentials, etc, the pane will display whatever debugging information we have in the client.

Once you have made a successful api call, we show both the request and response objects that the actions runtime uses internally to track your event. At the time of this writing, these are PERSISTED across individual calls, so if multiple calls appear and this is not desired behavior, you may want to reload the browser instance.
