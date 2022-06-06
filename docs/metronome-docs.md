---
title: Metronome (Actions) Destination
hide-boilerplate: true
hide-dossier: false
id: 
redirect_from:
  - '/connections/destinations/catalog/vendor-metronome'
versions:
  - name: Metronome
    link: /docs/connections/destinations/metronome
---
{% include content/plan-grid.md name="actions" %}

[Metronome](https://www.metronome.com){:target="_blank"} helps software companies launch, iterate, and scale their business models with billing infrastructure that works at any size and stage. With Metronome, your team can set up a world-class billing infrastructure with minimal time and investment.

With [Metronome](https://www.metronome.com){:target="_blank"}, you can enable product-led growth with a consistent source of truth for usage and billing. You can also freely experiment with pricing and packaging and put iteration directly in the hands of your Product team.

## Getting Started

1. From the Segment web app, click **Catalog**, then click **Destinations** 
2. Search for **Metronome** within the Destinations Catalog and select **Metronome (Actions)**
3. Click **Configure Actions Metronome**.
4. Select the source you’d like to connect to and give the destination a name
5. Enter your Metronome API Token into the Segment Connection Settings UI (save changes).

## Mapping

Your Segment events need to be mapped to the [Metronome event format](https://docs.metronome.com/getting-usage-data-into-metronome/overview/){:target="_blank"}. The five fields listed are the required fields for Metronome.

* transaction_id (string) - unique identifier for each event
* customer_id  (string) - which customer in Metronome the event applies to
* timestamp (string) - when the event happened in [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt){:target="_blank"}
* event_type (string) - the kind of event, e.g. page_view or cpu_used
* properties (object) - key/value pairs with details of the event


## Benefits of Metronome (Actions) vs Legacy Metronome Destination 
Metronome (Actions) provides the following benefits over the classic Metronome destination:

- **Streamlined Configuration**. Configure connection details on a per-event basis, rather than for the destination as a whole. 

- **Easier access to data**. The event variables picker shows you all the available data from the event you use to test the Trigger. Variables are clearly labeled to ensure they stand out from other text and markup.

- **Clearer mapping of data** Actions-based destinations enable you to define the mapping between the data Segment receives from your source, and the data Segment sends to Metronome.