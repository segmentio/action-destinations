# Destination Acceleration Strategy

## Building Destinations Faster Through Templates & Base Classes

**Date:** 2026-02-18
**Status:** Proposal
**Goal:** Reduce destination build time by 50-70% through reusable templates and base classes

---

## Executive Summary

Based on analysis of 210+ destinations with 812+ actions, we've identified clear patterns that can be abstracted into category-based templates. This strategy proposes:

1. **6 Category-Based Templates** covering 85%+ of use cases
2. **Shared Base Classes** for common functionality
3. **Field Library** with 100+ pre-mapped Segment fields
4. **CLI Generator** for rapid scaffolding
5. **Reference Implementations** as starting points

**Expected Impact:**

- **Current:** 2-3 weeks to build a destination
- **Target:** 3-5 days with templates
- **Reduction:** 60-70% faster

---

## Current State Analysis

### Destination Distribution by Category

| Category                  | Count | %   | Common Actions                         |
| ------------------------- | ----- | --- | -------------------------------------- |
| **Analytics**             | 40+   | 19% | Track, Identify, Page, Group           |
| **Advertising/Audiences** | 40+   | 19% | Add/Remove Audience, Sync              |
| **CRM/Sales**             | 30+   | 14% | Upsert Contact/Company, Log Activity   |
| **Marketing/Email**       | 25+   | 12% | Upsert Profile, Subscribe, Track Event |
| **Data Warehouse**        | 10+   | 5%  | Upload/Stream, Batch Export            |
| **Observability**         | 5+    | 2%  | Log Event, Track Error                 |
| **Other/Custom**          | 60+   | 29% | Webhook, Messaging, eCommerce          |

### Common Code Patterns

**Fields Reused Across Destinations:**

- User identifiers (userId, email, phone): **100%**
- Event data (name, properties, timestamp): **95%**
- Context (device, location, library): **80%**
- Traits (firstName, lastName, company): **70%**
- Ecommerce (items, revenue, currency): **30%**

**Authentication Schemes:**

- Custom API Keys: **72%** (152 destinations)
- OAuth2: **14%** (29 destinations)
- Basic Auth: **8%** (16 destinations)
- OAuth-Managed: **3%** (6 destinations)

**Batching Implementation:**

- Implements performBatch: **65%**
- Single-only (auto-batching): **35%**

---

## Proposed Architecture

### 1. Category-Based Base Classes

Create abstract base classes for each major category:

```
@segment/destinations-core/
├── templates/
│   ├── AnalyticsDestinationBase.ts
│   ├── CRMDestinationBase.ts
│   ├── AudienceDestinationBase.ts
│   ├── MarketingDestinationBase.ts
│   ├── DataExportDestinationBase.ts
│   └── ObservabilityDestinationBase.ts
├── fields/
│   ├── identifiers.ts
│   ├── context.ts
│   ├── traits.ts
│   ├── events.ts
│   └── ecommerce.ts
├── actions/
│   ├── TrackAction.ts
│   ├── IdentifyAction.ts
│   ├── UpsertProfileAction.ts
│   └── ...
└── utils/
    ├── batching.ts
    ├── authentication.ts
    └── transformers.ts
```

### 2. Template Hierarchy

```
DestinationBase
├── AnalyticsDestinationBase
│   ├── Actions: track(), identify(), page(), group()
│   ├── Fields: userId, anonymousId, event, properties, context
│   └── Examples: Amplitude, Mixpanel, PostHog
│
├── CRMDestinationBase
│   ├── Actions: upsertContact(), upsertCompany(), logActivity()
│   ├── Fields: email, firstName, lastName, company, traits
│   └── Examples: HubSpot, Salesforce, Pipedrive
│
├── AudienceDestinationBase (extends AudienceDestinationDefinition)
│   ├── Actions: addToAudience(), removeFromAudience(), sync()
│   ├── Hooks: createAudience(), getAudience()
│   └── Examples: Facebook, TikTok, LinkedIn
│
├── MarketingDestinationBase
│   ├── Actions: upsertProfile(), subscribe(), trackEvent()
│   ├── Fields: email, phone, listId, properties
│   └── Examples: Klaviyo, Braze, Intercom
│
├── DataExportDestinationBase
│   ├── Actions: uploadFile(), streamData(), batchExport()
│   ├── Formats: CSV, JSON, Parquet, Avro
│   └── Examples: S3, SFTP, Kafka, Snowflake
│
└── ObservabilityDestinationBase
    ├── Actions: logEvent(), trackError(), recordMetric()
    ├── Fields: severity, message, stackTrace, tags
    └── Examples: Datadog, New Relic, Sentry
```

---

## Detailed Template Specifications

### Template 1: Analytics Destination

**Purpose:** Track user behavior and product analytics

**Base Implementation:**

```typescript
import { AnalyticsDestinationBase } from '@segment/destinations-core/templates'
import { identifierFields, contextFields, eventFields } from '@segment/destinations-core/fields'

export default class MyAnalyticsPlatform extends AnalyticsDestinationBase {
  name = 'My Analytics Platform'
  slug = 'my-analytics-platform'

  // Minimal configuration needed
  authentication = {
    scheme: 'custom',
    fields: {
      apiKey: { type: 'password', label: 'API Key', required: true }
    }
  }

  // Automatically includes: track, identify, page, group actions
  // Override only if custom logic needed

  async track(payload: TrackPayload): Promise<Response> {
    return this.request(this.buildEndpoint('/events'), {
      method: 'POST',
      json: {
        user_id: payload.userId,
        event_name: payload.event,
        event_properties: payload.properties,
        timestamp: payload.timestamp
      }
    })
  }

  // identify(), page(), group() inherited with sensible defaults
}
```

**What's Included:**

- ✅ All 4 standard actions (track, identify, page, group)
- ✅ Pre-mapped fields (userId, event, properties, context)
- ✅ Batching support (configure batch size only)
- ✅ Default presets for common events
- ✅ Standard error handling

**Configuration Required:**

- Authentication scheme & fields
- API endpoint
- Transform payload (optional, has defaults)

**Time Savings:** 2 weeks → 3 days

---

### Template 2: CRM Destination

**Purpose:** Sync contacts, companies, and activities to CRM

**Base Implementation:**

```typescript
import { CRMDestinationBase } from '@segment/destinations-core/templates'
import { contactFields, companyFields } from '@segment/destinations-core/fields'

export default class MyCRM extends CRMDestinationBase {
  name = 'My CRM'
  slug = 'my-crm'

  authentication = {
    scheme: 'oauth2',
    fields: {
      /* OAuth config */
    },
    refreshAccessToken: this.handleOAuthRefresh
  }

  // Automatically includes: upsertContact, upsertCompany, logActivity

  async upsertContact(payload: ContactPayload): Promise<Response> {
    // Check if contact exists
    const contactId = await this.findContactByEmail(payload.email)

    if (contactId) {
      return this.updateContact(contactId, payload)
    } else {
      return this.createContact(payload)
    }
  }

  // upsertCompany(), logActivity() inherited or customized
}
```

**What's Included:**

- ✅ Contact/Company upsert actions
- ✅ Activity logging
- ✅ Pre-mapped CRM fields (email, name, company, title)
- ✅ OAuth2 refresh token handling
- ✅ Duplicate detection logic
- ✅ onDelete implementation for GDPR

**Configuration Required:**

- OAuth credentials
- Upsert logic (create/update endpoints)
- Field mapping (if non-standard)

**Time Savings:** 2-3 weeks → 4-5 days

---

### Template 3: Audience Destination

**Purpose:** Sync audiences to advertising platforms

**Base Implementation:**

```typescript
import { AudienceDestinationBase } from '@segment/destinations-core/templates'

export default class MyAudiencePlatform extends AudienceDestinationBase {
  name = 'My Audience Platform'
  slug = 'my-audience-platform'

  audienceFields = {
    listId: { type: 'string', label: 'List ID' }
  }

  // Implement only 3 required methods:

  async createAudience(input: CreateAudienceInput): Promise<AudienceOutput> {
    const response = await this.request('/audiences', {
      method: 'POST',
      json: { name: input.audienceName }
    })
    return { externalId: response.data.id }
  }

  async getAudience(input: GetAudienceInput): Promise<AudienceOutput> {
    const response = await this.request(`/audiences/${input.externalId}`)
    return { externalId: response.data.id }
  }

  async addToAudience(payload: AudiencePayload): Promise<Response> {
    return this.request(`/audiences/${payload.listId}/members`, {
      method: 'POST',
      json: { users: [{ email: payload.email, ... }] }
    })
  }

  // removeFromAudience() included automatically
}
```

**What's Included:**

- ✅ createAudience/getAudience hooks
- ✅ addToAudience/removeFromAudience actions
- ✅ Incremental sync logic
- ✅ Batch member operations
- ✅ Pre-configured presets
- ✅ Error handling for missing audiences

**Configuration Required:**

- Audience CRUD endpoints
- Member add/remove logic
- Identifier types (email, phone, etc.)

**Time Savings:** 2 weeks → 2-3 days

---

### Template 4: Marketing Automation

**Purpose:** Send events and manage contacts in marketing platforms

**Base Implementation:**

```typescript
import { MarketingDestinationBase } from '@segment/destinations-core/templates'

export default class MyMarketingPlatform extends MarketingDestinationBase {
  name = 'My Marketing Platform'
  slug = 'my-marketing-platform'

  // Includes: upsertProfile, subscribe, unsubscribe, trackEvent

  async upsertProfile(payload: ProfilePayload): Promise<Response> {
    return this.request('/profiles', {
      method: 'POST',
      json: {
        email: payload.email,
        attributes: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          ...payload.customAttributes
        }
      }
    })
  }

  async trackEvent(payload: EventPayload): Promise<Response> {
    return this.request('/events', {
      method: 'POST',
      json: {
        email: payload.email,
        event: payload.eventName,
        properties: payload.properties,
        time: payload.timestamp
      }
    })
  }
}
```

**What's Included:**

- ✅ Profile upsert with custom attributes
- ✅ Subscribe/unsubscribe actions
- ✅ Event tracking
- ✅ List management helpers
- ✅ Email validation

**Time Savings:** 1.5 weeks → 2-3 days

---

### Template 5: Data Export

**Purpose:** Export data to storage/warehouse

**Base Implementation:**

```typescript
import { DataExportDestinationBase } from '@segment/destinations-core/templates'

export default class MyDataExport extends DataExportDestinationBase {
  name = 'My Data Export'
  slug = 'my-data-export'

  format = 'csv' // or 'json', 'parquet', 'avro'
  compression = 'gzip' // optional

  async uploadBatch(payload: Payload[]): Promise<Response> {
    const fileContents = this.formatAsCSV(payload, {
      delimiter: ',',
      headers: this.getHeaders(payload)
    })

    return this.uploadFile(this.buildFilePath(payload), fileContents)
  }

  // Formatting helpers included: formatAsCSV, formatAsJSON, etc.
  // Compression helpers included: gzip, zip
}
```

**What's Included:**

- ✅ File generation (CSV, JSON, Parquet)
- ✅ Compression (gzip, zip)
- ✅ Batching logic
- ✅ File naming patterns
- ✅ Upload utilities

**Time Savings:** 2 weeks → 3-4 days

---

### Template 6: Observability

**Purpose:** Log events, errors, and metrics

**Base Implementation:**

```typescript
import { ObservabilityDestinationBase } from '@segment/destinations-core/templates'

export default class MyObservability extends ObservabilityDestinationBase {
  name = 'My Observability Platform'
  slug = 'my-observability-platform'

  async logEvent(payload: LogPayload): Promise<Response> {
    return this.request('/logs', {
      method: 'POST',
      json: {
        message: payload.message,
        level: payload.level || 'info',
        timestamp: payload.timestamp,
        attributes: payload.attributes,
        service: this.settings.serviceName
      }
    })
  }
}
```

**What's Included:**

- ✅ Log ingestion
- ✅ Error tracking
- ✅ Metric recording
- ✅ Severity levels
- ✅ Structured logging

**Time Savings:** 1 week → 2 days

---

## Shared Field Library

### Pre-Built Field Collections

**Location:** `@segment/destinations-core/fields/`

#### 1. Identifier Fields (`identifiers.ts`)

```typescript
export const identifierFields = {
  userId: {
    label: 'User ID',
    description: 'The unique user identifier',
    type: 'string',
    default: { '@path': '$.userId' }
  },
  anonymousId: {
    label: 'Anonymous ID',
    description: 'The anonymous user identifier',
    type: 'string',
    default: { '@path': '$.anonymousId' }
  },
  email: {
    label: 'Email',
    description: 'User email address',
    type: 'string',
    format: 'email',
    default: { '@path': '$.traits.email' }
  },
  phone: {
    label: 'Phone',
    description: 'User phone number',
    type: 'string',
    default: { '@path': '$.traits.phone' }
  },
  externalId: {
    label: 'External ID',
    description: 'External identifier for the user',
    type: 'string',
    default: { '@path': '$.context.externalId' }
  }
}
```

#### 2. Context Fields (`context.ts`)

```typescript
export const contextFields = {
  timestamp: {
    label: 'Timestamp',
    description: 'When the event occurred',
    type: 'datetime',
    default: { '@path': '$.timestamp' }
  },
  userAgent: {
    label: 'User Agent',
    type: 'string',
    default: { '@path': '$.context.userAgent' }
  },
  ipAddress: {
    label: 'IP Address',
    type: 'string',
    default: { '@path': '$.context.ip' }
  },
  locale: {
    label: 'Locale',
    type: 'string',
    default: { '@path': '$.context.locale' }
  }
  // ... 20+ more fields
}
```

#### 3. Trait Fields (`traits.ts`)

```typescript
export const traitFields = {
  firstName: {
    label: 'First Name',
    type: 'string',
    default: { '@path': '$.traits.firstName' }
  },
  lastName: {
    label: 'Last Name',
    type: 'string',
    default: { '@path': '$.traits.lastName' }
  },
  company: {
    label: 'Company',
    type: 'string',
    default: { '@path': '$.traits.company.name' }
  },
  title: {
    label: 'Title',
    type: 'string',
    default: { '@path': '$.traits.title' }
  }
  // ... 15+ more fields
}
```

#### 4. Event Fields (`events.ts`)

```typescript
export const eventFields = {
  eventName: {
    label: 'Event Name',
    type: 'string',
    required: true,
    default: { '@path': '$.event' }
  },
  properties: {
    label: 'Event Properties',
    description: 'Custom properties for the event',
    type: 'object',
    default: { '@path': '$.properties' }
  },
  revenue: {
    label: 'Revenue',
    type: 'number',
    default: { '@path': '$.properties.revenue' }
  },
  currency: {
    label: 'Currency',
    type: 'string',
    default: { '@path': '$.properties.currency' }
  }
}
```

#### 5. Ecommerce Fields (`ecommerce.ts`)

```typescript
export const ecommerceFields = {
  products: {
    label: 'Products',
    description: 'Array of products',
    type: 'object',
    multiple: true,
    default: {
      '@arrayPath': [
        '$.properties.products',
        {
          product_id: { '@path': '$.product_id' },
          name: { '@path': '$.name' },
          price: { '@path': '$.price' },
          quantity: { '@path': '$.quantity' }
        }
      ]
    }
  },
  orderId: {
    label: 'Order ID',
    type: 'string',
    default: { '@path': '$.properties.order_id' }
  },
  total: {
    label: 'Total',
    type: 'number',
    default: { '@path': '$.properties.total' }
  }
  // ... 10+ more fields
}
```

---

## CLI Generator Tool

### Installation & Usage

```bash
# Install globally
npm install -g @segment/destination-generator

# Generate new destination from template
segment-destination create my-analytics-platform \
  --template analytics \
  --auth custom \
  --name "My Analytics Platform"

# Interactive mode
segment-destination create --interactive
```

### Generator Flow

```
? Select destination category:
  ❯ Analytics (Track, Identify, Page, Group)
    CRM (Contacts, Companies, Activities)
    Audience (Sync, Add/Remove Members)
    Marketing (Profiles, Events, Campaigns)
    Data Export (CSV, JSON, Warehouse)
    Observability (Logs, Metrics, Errors)
    Custom (Start from scratch)

? Authentication scheme:
  ❯ API Key (Custom)
    OAuth 2.0
    Basic Auth
    No Authentication

? Include batching support? (Y/n)

? Generate test files? (Y/n)

✨ Generated destination at: src/destinations/my-analytics-platform/
📝 Next steps:
   1. cd src/destinations/my-analytics-platform
   2. Implement the track() method in actions/trackEvent/index.ts
   3. Update authentication in index.ts
   4. Run: npm test
   5. Run: npm run generate:types
```

### Generated Structure

```
my-analytics-platform/
├── index.ts                    # ✅ Complete, extend if needed
├── generated-types.ts          # ✅ Auto-generated
├── actions/
│   ├── trackEvent/
│   │   ├── index.ts           # ⚠️  Implement API call
│   │   └── generated-types.ts # ✅ Auto-generated
│   ├── identifyUser/
│   │   ├── index.ts           # ⚠️  Implement API call
│   │   └── generated-types.ts # ✅ Auto-generated
│   ├── pageView/
│   │   └── ...
│   └── groupIdentify/
│       └── ...
├── __tests__/
│   ├── index.test.ts          # ✅ Basic tests included
│   └── trackEvent.test.ts     # ✅ Action tests included
└── README.md                   # ✅ Documentation template
```

---

## Reference Implementations

### Tier 1: Minimal Templates (Start Here)

**webhook-extensible/** - Simplest possible destination

- Single generic action
- HMAC signing example
- OAuth2 with dynamic settings
- **Use for:** Custom webhooks, simple integrations

**amplitude-analytics/** - Clean analytics example

- 5 actions (track, identify, page, group, revenue)
- Custom auth (API key)
- Batching with flush
- **Use for:** Analytics platforms

**klaviyo-marketing/** - Marketing automation

- Profile upsert, list management, events
- API key auth
- Dynamic list selection
- **Use for:** Email/SMS marketing

### Tier 2: Advanced Patterns

**facebook-conversions-api/** - Audience + Conversions

- OAuth2 managed
- Pixel-based events
- Advanced field mapping
- **Use for:** Advertising platforms

**hubspot-crm/** - Full-featured CRM

- Contact/Company/Deal management
- OAuth2 with refresh
- onDelete implementation
- **Use for:** CRM/Sales tools

**liveramp-audiences/** - File export

- CSV generation
- S3/SFTP upload
- Batching with compression
- **Use for:** Data warehouses, file-based

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goals:**

- Create base classes for top 3 categories
- Build shared field library
- Set up testing infrastructure

**Deliverables:**

- ✅ `AnalyticsDestinationBase` class
- ✅ `CRMDestinationBase` class
- ✅ `AudienceDestinationBase` class
- ✅ Shared fields library (identifiers, context, traits)
- ✅ Unit tests for base classes
- ✅ Documentation

**Success Metrics:**

- Base classes cover 60%+ of Analytics destinations
- Field library reduces field definition by 70%+

### Phase 2: Templates & Generator (Weeks 3-4)

**Goals:**

- Complete remaining templates
- Build CLI generator tool
- Create reference implementations

**Deliverables:**

- ✅ `MarketingDestinationBase` class
- ✅ `DataExportDestinationBase` class
- ✅ `ObservabilityDestinationBase` class
- ✅ CLI generator with interactive mode
- ✅ 6 reference implementations (one per category)
- ✅ Migration guide for existing destinations

**Success Metrics:**

- Generator produces working destination in <5 minutes
- Templates cover 85%+ of destination types

### Phase 3: Pilot & Validation (Weeks 5-6)

**Goals:**

- Build 3 new destinations using templates
- Measure time savings
- Gather feedback

**Deliverables:**

- ✅ 3 new destinations built with templates
- ✅ Time comparison analysis
- ✅ Developer feedback survey
- ✅ Template improvements based on feedback

**Success Metrics:**

- 50%+ time reduction vs traditional approach
- 80%+ developer satisfaction
- Zero template-related bugs

### Phase 4: Rollout & Adoption (Weeks 7-8)

**Goals:**

- Documentation and training
- Team onboarding
- Migrate existing destinations (optional)

**Deliverables:**

- ✅ Complete developer guide
- ✅ Video tutorials
- ✅ Team training sessions
- ✅ Template best practices doc
- ✅ Migration scripts for legacy destinations

**Success Metrics:**

- 100% team trained
- 5+ destinations built with templates
- Template usage for all new destinations

---

## Success Metrics & KPIs

### Time Reduction Targets

| Destination Type     | Current Time | Target Time | Reduction |
| -------------------- | ------------ | ----------- | --------- |
| **Simple Analytics** | 1-2 weeks    | 2-3 days    | 70%       |
| **CRM/Sales**        | 2-3 weeks    | 4-5 days    | 65%       |
| **Audience Sync**    | 2 weeks      | 2-3 days    | 75%       |
| **Marketing**        | 1.5 weeks    | 2-3 days    | 70%       |
| **Data Export**      | 2 weeks      | 3-4 days    | 65%       |
| **Observability**    | 1 week       | 2 days      | 70%       |

**Overall Target:** 60-70% reduction in development time

### Quality Metrics

- **Code Reuse:** 70%+ of code from templates/libraries
- **Bug Rate:** 50% reduction (standardized patterns)
- **Test Coverage:** 80%+ (included with templates)
- **Documentation:** 100% coverage (auto-generated)

### Adoption Metrics

- **Month 1:** 20% of new destinations use templates
- **Month 3:** 50% of new destinations use templates
- **Month 6:** 80%+ of new destinations use templates
- **Year 1:** Consider migrating high-traffic legacy destinations

---

## Risk Mitigation

### Risk 1: Templates Too Rigid

**Mitigation:**

- Design for extensibility (inheritance, composition)
- Allow full override of any method
- Provide escape hatches for custom logic
- Document customization patterns

### Risk 2: Maintenance Overhead

**Mitigation:**

- Comprehensive test coverage for base classes
- Version templates independently
- Deprecation strategy for breaking changes
- Active developer feedback loop

### Risk 3: Adoption Resistance

**Mitigation:**

- Make templates optional, not mandatory
- Show time savings with real examples
- Provide migration assistance
- Celebrate early adopters

### Risk 4: Not All Destinations Fit Templates

**Mitigation:**

- Support custom destinations (no template)
- Extensible base classes
- Composable utilities (use à la carte)
- Regular template expansion based on patterns

---

## Comparison: Before vs After

### Before (Current Approach)

**Building an Analytics Destination:**

1. Create directory structure (30 min)
2. Define destination index.ts (1 hour)
3. Define authentication (2 hours)
4. Create trackEvent action (1 day)
   - Define all fields manually
   - Implement perform logic
   - Implement performBatch logic
   - Error handling
5. Create identifyUser action (1 day)
6. Create pageView action (1 day)
7. Create groupIdentify action (1 day)
8. Write tests (2 days)
9. Documentation (1 day)
10. Review & iterate (2 days)

**Total: 10-12 days**

### After (With Templates)

**Building an Analytics Destination:**

1. Run generator: `segment-destination create my-analytics --template analytics` (5 min)
2. Configure authentication (30 min)
3. Implement API calls for actions (1.5 days)
   - track() method
   - identify() method
   - page() method
   - group() method
4. Run tests (included) (30 min)
5. Review & deploy (1 day)

**Total: 3 days**

**Time Saved: 7-9 days (70%+ reduction)**

---

## Next Steps

### Immediate Actions (This Week)

1. **Review & Approval**

   - Present strategy to team (meeting today at 4:30/5:00)
   - Get feedback from Sandia, Ash
   - Finalize category definitions

2. **Prototype Base Class**

   - Build `AnalyticsDestinationBase` as proof of concept
   - Demonstrate time savings with real destination
   - Validate approach with team

3. **Field Library Audit**
   - Extract common fields from top 20 destinations
   - Document patterns and defaults
   - Create shared field definitions

### Short Term (Next 2 Weeks)

1. **Build Foundation**

   - Implement 3 base classes (Analytics, CRM, Audience)
   - Create shared field library
   - Write comprehensive tests

2. **Create Reference Implementations**
   - Identify 3 simple destinations to refactor
   - Rebuild using templates
   - Document patterns

### Medium Term (Next 4-6 Weeks)

1. **Build CLI Generator**

   - Interactive template selection
   - Auto-generate boilerplate
   - Include tests and docs

2. **Pilot Program**

   - Build 3 new destinations with templates
   - Measure time savings
   - Iterate based on feedback

3. **Documentation & Training**
   - Developer guide
   - Video tutorials
   - Best practices

### Long Term (3-6 Months)

1. **Full Rollout**

   - All new destinations use templates
   - Optional migration for legacy destinations
   - Continuous improvement

2. **Advanced Features**
   - Visual destination builder (UI)
   - AI-assisted code generation
   - Automated testing framework

---

## Appendix A: Code Examples

### Example 1: Analytics Destination (Full)

```typescript
// src/destinations/my-analytics/index.ts
import { AnalyticsDestinationBase } from '@segment/destinations-core/templates'
import type { Settings } from './generated-types'

export default class MyAnalyticsDestination extends AnalyticsDestinationBase<Settings> {
  name = 'My Analytics Platform'
  slug = 'actions-my-analytics'
  description = 'Send events to My Analytics Platform'

  authentication = {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your My Analytics API key',
        type: 'password',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Data center region',
        type: 'string',
        choices: [
          { label: 'US', value: 'us' },
          { label: 'EU', value: 'eu' }
        ],
        default: 'us'
      }
    },
    testAuthentication: async (request, { settings }) => {
      return request(`https://api-${settings.region}.myanalytics.com/validate`, {
        method: 'GET',
        headers: { 'X-API-Key': settings.apiKey }
      })
    }
  }

  extendRequest({ settings }) {
    return {
      headers: {
        'X-API-Key': settings.apiKey,
        'Content-Type': 'application/json'
      }
    }
  }

  // Override track action to customize API call
  async track(payload: TrackPayload, settings: Settings): Promise<Response> {
    const endpoint = `https://api-${settings.region}.myanalytics.com/events`

    return this.request(endpoint, {
      method: 'POST',
      json: {
        user_id: payload.userId || payload.anonymousId,
        event_name: payload.event,
        event_properties: payload.properties,
        timestamp: payload.timestamp,
        context: {
          library: payload.context?.library?.name,
          device: payload.context?.device,
          os: payload.context?.os
        }
      }
    })
  }

  // identify(), page(), group() inherited with default implementation
  // Or override them like track() above if needed
}
```

**Lines of Code:**

- **With template:** ~60 lines
- **Without template:** ~300+ lines
- **Savings:** 80%

### Example 2: CRM Destination (Full)

```typescript
// src/destinations/my-crm/index.ts
import { CRMDestinationBase } from '@segment/destinations-core/templates'
import type { Settings } from './generated-types'

export default class MyCRMDestination extends CRMDestinationBase<Settings> {
  name = 'My CRM'
  slug = 'actions-my-crm'

  authentication = {
    scheme: 'oauth2',
    fields: {
      subdomain: {
        label: 'Account Subdomain',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { auth, settings }) => {
      const response = await request('https://oauth.mycrm.com/token', {
        method: 'POST',
        json: {
          grant_type: 'refresh_token',
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret
        }
      })

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token
      }
    }
  }

  extendRequest({ auth, settings }) {
    return {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'X-Subdomain': settings.subdomain
      }
    }
  }

  // Implement upsert contact
  async upsertContact(payload: ContactPayload, settings: Settings): Promise<Response> {
    const baseUrl = `https://${settings.subdomain}.mycrm.com/api/v2`

    // Search for existing contact by email
    const searchResponse = await this.request(`${baseUrl}/contacts/search`, {
      method: 'POST',
      json: { email: payload.email }
    })

    const contactId = searchResponse.data.contacts[0]?.id

    const contactData = {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
      title: payload.title,
      custom_fields: payload.customProperties
    }

    if (contactId) {
      // Update existing contact
      return this.request(`${baseUrl}/contacts/${contactId}`, {
        method: 'PUT',
        json: contactData
      })
    } else {
      // Create new contact
      return this.request(`${baseUrl}/contacts`, {
        method: 'POST',
        json: contactData
      })
    }
  }

  // upsertCompany(), logActivity() can be similarly implemented
}
```

---

## Appendix B: Template Feature Matrix

| Feature              | Analytics | CRM          | Audience | Marketing    | Data Export | Observability |
| -------------------- | --------- | ------------ | -------- | ------------ | ----------- | ------------- |
| **Track Action**     | ✅        | ⚠️           | ❌       | ✅           | ✅          | ✅            |
| **Identify Action**  | ✅        | ⚠️ (Upsert)  | ❌       | ⚠️ (Profile) | ✅          | ❌            |
| **Page Action**      | ✅        | ❌           | ❌       | ⚠️           | ✅          | ❌            |
| **Group Action**     | ✅        | ⚠️ (Company) | ❌       | ❌           | ✅          | ❌            |
| **Upsert Profile**   | ❌        | ✅           | ❌       | ✅           | ❌          | ❌            |
| **Add to Audience**  | ❌        | ❌           | ✅       | ⚠️           | ❌          | ❌            |
| **Create Audience**  | ❌        | ❌           | ✅       | ⚠️           | ❌          | ❌            |
| **Log Activity**     | ❌        | ✅           | ❌       | ❌           | ❌          | ❌            |
| **Batch Export**     | ❌        | ❌           | ❌       | ❌           | ✅          | ❌            |
| **File Generation**  | ❌        | ❌           | ❌       | ❌           | ✅          | ❌            |
| **Log Event**        | ❌        | ❌           | ❌       | ❌           | ❌          | ✅            |
| **Track Error**      | ❌        | ❌           | ❌       | ❌           | ❌          | ✅            |
|                      |           |              |          |              |             |               |
| **Batching Support** | ✅        | ⚠️           | ✅       | ⚠️           | ✅          | ✅            |
| **OAuth2 Support**   | ⚠️        | ✅           | ✅       | ⚠️           | ⚠️          | ⚠️            |
| **onDelete Hook**    | ⚠️        | ✅           | ⚠️       | ✅           | ❌          | ❌            |
| **Dynamic Fields**   | ❌        | ⚠️           | ⚠️       | ⚠️           | ❌          | ❌            |
| **Presets Included** | ✅        | ✅           | ✅       | ✅           | ⚠️          | ⚠️            |

Legend:

- ✅ Fully supported/included
- ⚠️ Partially supported/optional
- ❌ Not applicable/not included

---

## Appendix C: Developer Survey Questions

**Post-Implementation Survey for Developers:**

1. How long did it take you to build the destination?

   - [ ] < 2 days
   - [ ] 2-3 days
   - [ ] 4-5 days
   - [ ] 1 week
   - [ ] > 1 week

2. How much time did the template save you?

   - [ ] No time saved
   - [ ] 20-40%
   - [ ] 40-60%
   - [ ] 60-80%
   - [ ] > 80%

3. What was most helpful about the template?

   - [ ] Pre-defined fields
   - [ ] Action boilerplate
   - [ ] Batching logic
   - [ ] Authentication setup
   - [ ] Test files
   - [ ] Documentation

4. What could be improved?

   - (Free text)

5. Would you use templates for your next destination?
   - [ ] Yes, definitely
   - [ ] Probably
   - [ ] Not sure
   - [ ] Probably not
   - [ ] No

---

## Summary

This strategy provides a comprehensive approach to accelerate destination development through:

1. **Category-based templates** covering 85%+ of use cases
2. **Shared field library** reducing field definition effort by 70%+
3. **CLI generator** for rapid scaffolding
4. **Reference implementations** as starting points
5. **Clear migration path** from current approach

**Expected outcomes:**

- ✅ 60-70% reduction in development time
- ✅ Higher code quality through standardization
- ✅ Better documentation (auto-generated)
- ✅ Easier maintenance
- ✅ Faster onboarding for new developers

**Next steps:** Review with team, build prototype, pilot with 3 destinations, measure results, iterate and roll out.

---

**Questions or feedback?** Contact the Destinations team or open an issue in the action-destinations repo.
