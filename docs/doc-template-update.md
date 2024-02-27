---
# The end name should be similar to `Slack (Actions) Destination`
title: <destination_name>
hide-boilerplate: true
hide-dossier: true
---

<!-- This template is meant for Actions-based destinations that represent a new version of an existing, or Classic Segment destination. For new Actions-based destinations, see the doc-template-new.md template -->

<!-- In the section above, edit the `title` field. For example, Slack (Actions) Destination -->

{% include content/plan-grid.md name="actions" %}

<!-- Include a brief description of the destination here, along with a link to your website. -->

<!-- In the section below, add your destination name where indicated. If you have a classic version of the destination, ensure that its documentation is linked as well. If you don't have a classic version of the destination, remove the second and third sentences. -->

> success ""
> **Good to know**: This page is about the [Actions-framework](/docs/connections/destinations/actions/) <destination_name> Segment destination. There's also a page about the [non-Actions <destination_name> destination](/docs/connections/destinations/catalog/<destination_name>/). Both of these destinations receives data from Segment.

<!-- This include describes the requirement of A.js 2.0 or higher for Actions compatibility, and is required if your destination has a web component. -->

{% include content/ajs-upgrade.md %}

<!-- In the section below, explain the value of this actions-based destination over the classic version, if applicable. If you don't have a classic version of the destination, remove this section. -->

## Benefits of <destination_name> (Actions) vs <destination_name> Classic

<destination_name> (Actions) provides the following benefits over the classic <destination_name> destination:

- **Main point 1**. One or two sentences that back up the main point.
- **Main point 2**. One or two sentences that back up the main point.

<!-- The section below explains how to enable and configure the destination. Include any configuration steps not captured below. For example, obtaining an API key from your platform and any configuration steps required to connect to the destination. -->

## Getting started

1. From the Segment web app, click **Catalog**, then click **Destinations**.
2. Find the Destinations Actions item in the left navigation, and click it.
3. Click **Configure <desintation_name>**.
4. Select an existing Source to connect to <destination_name> (Actions).

<!-- The line below renders a table of connection settings (if applicable), Pre-built Mappings, and available actions. -->

{% include components/actions-fields.html %}

<!--
Additional Context

Include additional information that you think will be useful to the user here. For information that is specific to an individual mapping, please add that as a comment so that the Segment docs team can include it in the auto-generated content for that mapping.
-->

<!-- If applicable, add information regarding the migration from a classic destination to an Actions-based version below -->

## Migration from the classic <destination_name> destination

<!-- Include any pertinent information here. -->
