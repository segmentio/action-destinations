# Segment Developer Center 2.0 Partner Program Overview

Welcome! Here are the steps you’ll follow to build an integration on Dev Center 2.0, launch your destination to Private Beta so customers can test it, and then launch it as Public in the Segment catalog.

Before continuing, please make sure to read our [Code of Conduct](./CODE_OF_CONDUCT.md). By contributing to this project, you are expected to uphold this code.

## Steps

1. [Become a Segment Partner](#become-a-segment-partner)
2. [Plan your integration](#plan-your-integration)
3. [Build your integration](#build-your-integration)
4. [Submit a pull request](#submit-a-pull-request)
5. [Write-documentation](#write-documentation)
6. [Provide catalog metadata](#provide-integration-metadata-for-the-catalog)
7. [Release to Private Beta](#release-to-private-beta-for-customer-testing)
8. [Release to Public](#release-to-public-in-the-segment-catalog)
9. [Submitting subsequent changes](#submitting-changes-after-your-integration-is-already-live)

## Become a Segment Partner

1. Sign up for the [Segment Select Partner Program](https://segment.com/partners/integration/). During the sign-up process, you’ll agree to the [Segment Partner Program Agreement](https://segment.com/legal/partnersagreement/) and [Privacy Policy](https://segment.com/legal/privacy/).

2. Sign up for the [Segment Developer Center 2.0 Public Beta](https://airtable.com/shrvZzQ6NTTwsc6rQ). Dev Center 2.0 is currently in a closed Pilot, and we are accepting prospective partners on our Public Beta waiting list. You’ll hear from us in Q2 2022 with a timeline to start building.

## Plan your integration

1. To get an overview of the project, read the [README](./README.md). Here are some resources to help you get started.

   - [Get Started](./README.md#get-started)
   - [Building new Action Destination](./docs/create.md)
   - [Authentication](./docs/authentication.md)
   - [CLI Commands](./packages/cli/README.md)
   - [Local Testing](./docs/testing.md)

2. Decide what type of destination you want to build. We currently support building cloud-mode and device-mode web destinations; we generally recommend building a cloud-mode destination, because data is sent to Segment prior to going to your API, so customers can take advantage of Segment features like filters, transformations, and replays. You can learn more here. Currently, we do not enable partners to build device-mode mobile destinations. We recommend building a plugin to get information like session ID from the device.

3. Spec out the integration. If you want some guidance, you can use this [template](https://docs.google.com/document/d/1dIJxYge9N700U9Nhawapy25WMD8pUuey72S5qo3uejA/edit#heading=h.92w309fjzhti), which will prompt you to think about: whether you want to build a cloud-mode or device-mode destination, the method of authentication, the settings, and the Actions and default Field Mappings that you want to build.

4. Join the Segment Partners Slack workspace. We’ll send you an invite. The **#dev-center-pilot** channel is the space for questions - partners can share their advice with each other, and the Segment team is there to answer any tricky questions.

## Build your integration

1. You do not need to access a Segment dev environment to build an integration. You’ll test it with a local serve command.
   The integration will be written in Typescript. For more, see https://www.typescriptlang.org/docs/.

2. To work with Segment's actions repo, you’ll need to download node (check version [here](https://github.com/segmentio/action-destinations/blob/main/.nvmrc)), nvm and yarn.

3. To test your integration:

   - For cloud-mode destinations, follow these instructions: [Build & Test Cloud Destinations](./docs/testing.md).
   - If you are building a device-mode destination, see the [browser-destinations README](./packages/browser-destinations/README.md).

4. When you have questions, ask in the Segment Partners Slack workspace - use the **#dev-center-pilot** channel.

## Submit a pull request

1. Once you’ve finished making your changes, added unit tests for new functionality, and tested end-to-end using the local server, you can create a pull request.

   - When creating a PR, please include a description of the changes made and why. This will help during the code review process.
   - Verify that you have thoroughly tested your changes by selecting the appropriate checkboxes.
   - A Segment developer will review the PR. They may ask for changes to be completed before the PR can be merged. Once all changes are made, the Segment developer will approve the PR.
   - _Note:_ When you submit a PR, the Segment team will be automatically notified. The turnover time for reviews may take up to 2-3 business days.

2. Your PR is merged!
   - Congratulations! Once your PR is merged by a Segment developer, they will deploy your changes and notify you when it’s publicly available. If the destination is in private beta, our folks at Segment will provide a link to access your destination. Once the destination is ready for general availability and has been approved, the destination will be visible from the catalog itself.
   - _Note_: we currently do weekly deploys on Wednesdays for all non-emergency changes. Changes should be approved and merged by Tuesday EOD to make the Wednesday release. Thank you!

## Write documentation

Documentation ensures users of your destination can enable and configure the destination, and understand how it interacts with your platform.

1. Write your integration’s documentation. Segment provides two templates: [doc-template-new.md](./docs/doc-template-new.md) for new destinations, and [doc-template-update.md](./docs/doc-template-update.md) for updates to existing destinations.

These templates contain content that automatically pulls in information. Do not edit this content.

- The table at the top is the yaml front matter, and it is not rendered in the final documentation.
- The snippet `{% include content/plan-grid.md name="actions" %}` indicates which Segment account tiers have access to Destination Actions; all account tiers have access.
- The snippet `{% include content/ajs-upgrade.md %}` is a note to encourage customers to upgrade to Analytics.js 2.0.
- The snippet `{% include components/actions-fields.html %}` will automatically populate information about your destination’s Settings, Mappings, Actions, and Action fields, using Segment's Public API. This information will be populated as soon as your destination reaches the Public Beta phase. This means you don't need to include any of this information in your documentation.

These templates contain sections that you should edit to explain the following:

- The purpose of the destination
- Benefits / features of the destination
- Steps to add and configure the destination within Segment (replace the destination name with your destination)
- Breaking changes compared to a classic version of the destination (if applicable)
- Migration steps (if applicable)

To help you write your documentation, see examples of documentation for other destinations: [Slack (Actions) Destination](https://segment.com/docs/connections/destinations/catalog/actions-slack/), [TikTok Conversions Destination](https://segment.com/docs/connections/destinations/catalog/tiktok-conversions/).

2. Submit your documentation for review.
   - Create a fork of the [segmentio/segment-docs](https://github.com/segmentio/segment-docs) repository.
   - Add the markdown file you created in the previous step to the following location: `src/connections/destinations/catalog/<destination_name>/index.md`.
   - Submit a pull request, and a Segment Docs team member will comment with any questions or comments.

## Provide integration metadata for the catalog

Send the following information to partner-support@segment.com using the below template:

Please find the below info for _Name of integration_ Catalog entry.

- **Name:** _Name of integration_
- **Link to your most recent PR on the actions-destination repo:** _Link to PR_
- **Description:** _Brief description of your integration, up to ~500 characters. Descriptions can include formatted text and lists. Optionally, you can include up to two images, such as screenshots, with or without captions._
- **Website:** _Website for your company or product, for example https://amplitude.com_
- **Categories:** _Select a primary and (optional) secondary category where your integration will appear in the catalog._
  - Choose from: A/B Testing, Advertising, Analytics, Attribution, CRM, Customer Success, Deep Linking, Email Marketing, Enrichment, Feature Flagging, Heatmaps & Recordings, Livechat, Marketing Automation, Performance Monitoring, Personalization, Raw Data, Referrals, Security & Fraud, SMS & Push Notifications, Surveys, Tag Managers, Video
- **Logo:** _Your logo includes the name of your company. A horizontal lockup is best. File type must be SVG._
- **Mark:** _Your mark is square and does not include the name of your company. File type must be SVG._
- **Customer support email address:** _Email address for customer support inquiries. This email address will not be surfaced to users of the integration; instead it will be used by Segment customer support. Should Segment receive an inquiry about the integration from a Segment customer, Segment support will send the inquiry to this email address._

## Release to Private Beta for customer testing

1. During Private Beta, the integration will not be publicly listed in the catalog. You and your customers can access the catalog page using a special URL: https://app.segment.com/goto-my-workspace/destinations/catalog/${destination-slug} (This will direct users to the install page in their workspace)

2. Verify that the catalog entry renders correctly,

3. Invite one or more customers to test the integration by giving them the URL. At least 1 customer must verify that the destination works before we can make the destination public.

## Release to Public in the Segment catalog

1. Once at least 1 customer successfully uses the integration, let us know. We’ll make your destination Public. Any Segment customer can find it in the catalog, and it will be featured on the New & Noteworthy page..

2. Write a blog post for your company’s blog, write a [recipe](https://segment.com/recipes/) to help customers solve a specific problem using your Integration, and/or work with our Marketing team to be featured in the Segment blog.

3. Maintain your integration. Fix bugs, update it if your APIs change, add functionality as requested by customers.

## Submitting changes after your Integration is already live

After your Integration is live and in use by customers you will still be able to make changes to your Integration code. However, an extra level of governance and oversight is required in order to avoid causing issues for customers who are already using your Integration.

Please observe the dos and dont's listed below:

**Please do not:**

1. Do not add a **required** field to an Integration which is already in use by customers. Doing so will prevent existing instances of your Integration from working, and will lead to an incident.

2. Do not change your perform() or batchPerform() functions so that they now depend on a value from a field in order for the outbound API call to be successful. Doing so may cause pre-existing Integrations to fail.

3. Do not raise a PR containing changes for more than 1 Integration. For example if you need to make changes to a Cloud Mode and Device Mode Integration you should raise separate PRs.

4. Do not change the name or slug of your Integration after the Integration has been deployed. If you do want to change the name of your Integration please email partner-support@segment.com.

5. Do not delete an Action from an Integration. This capability is not yet supported by our Framework. If you do want to do this please email partner-support@segment.com.

**Please do the following:**

1. If adding a new field or amending the configuration of an existing field, please attach a video to the PR of you testing the change using the [Action Tester](./docs/testing.md). Try to use realistic Segment API payloads as inputs, and if possible show how the payloads are reflected in your Destination platform.
