---
# The end name should be similar to `Slack (Actions) Destination`
title: <destination_name>
hide-boilerplate: true
hide-dossier: true
---

<!-- In the section above, edit the `title` field. For example, Slack (Actions) Destination -->

{% include content/plan-grid.md name="actions" %}

<!-- Include a brief description of the destination here, along with a link to your website. -->

> info ""
> This document is about a feature which is in beta. This means that the Destination Actions are in active development, and some functionality may change before it becomes generally available

<!-- In the section below, add your destination name where indicated. If you have a classic version of the destination, ensure that its documentation is linked as well. If you don't have a classic version of the destination, remove the second and third sentences. -->

> success ""
> **Good to know**: This page is about the [Actions-framework](/docs/connections/destinations/actions/) <destination_name> Segment destination. There's also a page about the [non-Actions <destination_name> destination](/docs/connections/destinations/catalog/<destination_name>/). Both of these destinations receives data from Segment.

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

<!-- The line below renders a table of connection settings (if applicable) from your destinations data file. The Segment Docs team will assist with this. -->

{% include components/actions-fields.html name="<destination_name>" connection="true" %}

<!-- The section below provides an overview of the prebuilt subscriptions that ship with your destination. If there are no prebuilt subscriptions, remove this section. -->

## Pre-built subscriptions

By default a new <destination_name> (Actions) destination comes with the following subscriptions.

You can select these subscriptions by choosing "Quick Setup" when you first configure the destination. You can enable, edit, and disable them from the screen that appears.

| Subscription Name  | Trigger                                   | <destination_name> Action |
| ------------------ | ----------------------------------------- | ------------------------- |
| First Subscription | The default trigger for this subscription | The action used           |

<!-- The section below provides reference tables for the actions defined in your destination. Create the unordered list. The Segment Docs team will assist with populating the data file referenced by this include. -->

## Available <destination_name> actions

Combine the supported [triggers](/docs/connections/destinations/actions/#components-of-a-destination-action) with the following <destination_name>-supported actions:

- [Action One](#action-one)
- [Action Two](#action-two)
- [Action Three](#action-three)

{% include components/actions-fields.html name="<destination_name>" %}

<!-- Add information about steps needed to migrate from a classic version of your destination here. The Segment Docs team will assist you with populating the data file referenced by this include. The table at the bottom maps classic settings to the new destination.-->

## Migration from the classic Slack destination

<!-- Include any pertinent information here. -->

Follow the table below to map your existing Slack destination configuration to Slack (Actions).

{% include components/actions-map-table.html name="slack" %}
