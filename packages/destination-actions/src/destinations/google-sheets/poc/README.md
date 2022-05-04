# Google Sheets Destination - proof of concept

## Setup

- Download the credential of your OAuth application from Google Cloud Platform: https://console.cloud.google.com/apis/credentials?project=rhall-test-project
  (You may use the one called _rhall-test-web_)
- Store the credentials .json file in `/src/destinations/google-sheets/poc/*.json`
- Update the `CONFIG.credentialsFile` in `./index.ts` to be the file name you downloaded
- Update the `CONFIG.spreadsheetId` in `./index.ts` to be the identifier of a spreadsheet that your Google Account has access to.

## Use

- **(VSCode only)** Start the server by using the Debug launcher called `Launch POC`
- Go to [getToken](http://localhost:3000/getToken) endpoint to start the OAuth2.0 Authorization flow
  - Select your Google Account (_@twilio.com)
  - Accept the dialog and grant the required scopes
  - You will end in the `/callback` endpoint with the token committed to the HTML query string and session.
- Click the [call](http://localhost:3000/call) link to execute the code in the call handler, which should be able to perform an authenticated Google Sheets API call
