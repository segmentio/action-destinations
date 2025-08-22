Read and understand all the files in this folder: /Users/joeayoub/dev/src/github.com/segmentio/action-destinations/packages/destination-actions/claude module 1

The process for building a new Destination is as follows:

# Initial investigation

1. Ask the user which platform the Destination will send data to. What's the API?
2. Find out which authentication model the API uses. This is usually Oauth or API Key.
3. Understand which types of Segment data will be sent to the Destination platform via the API. The types of data to send are any combination of the following:

- track() payloads: user based analytics events
- page() payloads: user based web page view analytics events
- screen() payloads: user based mobile screen view analytics events
- identify() payloads: user profile data
- group() payloads: company or organization profile data
- Audience membership data: notify the Destination platform when a user is added or removed from an Audience.

3. Figure out how many Actions will be needed. Some design considerations:

- Some Destination APIs allow for analytics events, user profile data and audience membership data to be transmitted in the same API call. In these cases, a single Action may be sufficient.
- Some Destinations require separate API calls to be made when sending analytics events Vs user profile data Vs audience membership. In these cases it's likely that multiple Actions will be needed
- Some Destinations have predefined analytics specifications for different types of analytics events. For example, the API call used to send a purchase event might be different to that for a link click event. In these scenarios multiple Actions may be needed even if only analytics event data is to be sent.

4. List the names of each Action, a 1 line description of what it will do, and which API endpoint will be called.

# Create the Destination folder structure

1. create a folder named after the Destination platform in the segmentio/action-destinations/packages/destination-actions/src/destinations location.
2. create the empty index.ts file for the Destination Definition.
3. create the empty generate-types file for the Typescript interface for the Destination Definition.
4. For each Action, create a new folder in the Destination folder.
5. In each Action's folder, create an empty index.ts file for the Action Definition.
6. In each Action's folder, create an empty generated-types.ts file for the Typescript interface for the Action Definition.
