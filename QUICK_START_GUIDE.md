# Quick Start: Building Destinations 70% Faster

## TL;DR

Use category-based templates to build destinations in **2-5 days** instead of **2-3 weeks**.

```bash
# Install generator
npm install -g @segment/destination-generator

# Create new destination from template
segment-destination create my-platform --template analytics

# Implement 1 method, deploy
```

---

## Choose Your Template

### 🎯 Analytics (Track user behavior)

**Examples:** Amplitude, Mixpanel, PostHog
**Actions:** Track, Identify, Page, Group
**Time:** 2-3 days (was 10-12 days)

```typescript
async track(payload) {
  return this.request('/events', {
    json: {
      user_id: payload.userId,
      event: payload.event,
      properties: payload.properties
    }
  })
}
```

---

### 👥 CRM (Manage contacts & companies)

**Examples:** HubSpot, Salesforce, Pipedrive
**Actions:** Upsert Contact, Upsert Company, Log Activity
**Time:** 4-5 days (was 15-20 days)

```typescript
async upsertContact(payload) {
  const contactId = await this.findContact(payload.email)
  if (contactId) {
    return this.updateContact(contactId, payload)
  } else {
    return this.createContact(payload)
  }
}
```

---

### 📢 Audience (Sync user lists)

**Examples:** Facebook, TikTok, LinkedIn
**Actions:** Add to Audience, Remove from Audience
**Time:** 2-3 days (was 10-14 days)

```typescript
async createAudience(input) {
  const response = await this.request('/audiences', {
    json: { name: input.audienceName }
  })
  return { externalId: response.data.id }
}

async addToAudience(payload) {
  return this.request(`/audiences/${payload.listId}/members`, {
    json: { users: [payload] }
  })
}
```

---

### 📧 Marketing (Email/SMS campaigns)

**Examples:** Klaviyo, Braze, Intercom
**Actions:** Upsert Profile, Subscribe, Track Event
**Time:** 2-3 days (was 7-10 days)

```typescript
async upsertProfile(payload) {
  return this.request('/profiles', {
    json: {
      email: payload.email,
      attributes: payload.traits
    }
  })
}
```

---

### 💾 Data Export (CSV/JSON files)

**Examples:** S3, SFTP, Snowflake
**Actions:** Upload Batch, Stream Data
**Time:** 3-4 days (was 10-14 days)

```typescript
async uploadBatch(payload) {
  const csv = this.formatAsCSV(payload)
  return this.uploadFile(this.buildPath(), csv)
}
```

---

### 📊 Observability (Logs & metrics)

**Examples:** Datadog, New Relic, Sentry
**Actions:** Log Event, Track Error, Record Metric
**Time:** 2 days (was 5-7 days)

```typescript
async logEvent(payload) {
  return this.request('/logs', {
    json: {
      message: payload.message,
      level: payload.level,
      attributes: payload.attributes
    }
  })
}
```

---

## What You Get

### ✅ Pre-Built Actions

- Track, Identify, Page, Group (Analytics)
- Upsert Contact, Company, Activity (CRM)
- Add/Remove from Audience (Audience)
- Subscribe, Track Event (Marketing)

### ✅ Pre-Mapped Fields

- User identifiers (userId, email, phone)
- Context (device, location, library)
- Traits (name, company, title)
- Event properties
- Timestamps

### ✅ Built-In Features

- Batching support
- Error handling
- OAuth2 refresh tokens
- GDPR deletion hooks
- Test files
- Documentation

### ✅ Shared Field Library

100+ pre-mapped Segment fields:

```typescript
import { identifierFields, contextFields, traitFields } from '@segment/destinations-core/fields'

// Use in your action:
fields: {
  ...identifierFields,  // userId, email, phone, etc.
  ...contextFields,     // device, location, etc.
  ...traitFields        // firstName, lastName, etc.
}
```

---

## Before vs After

### ❌ Before (Traditional)

```typescript
// 300+ lines per action
const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send events to platform',
  defaultSubscription: 'type = "track"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The unique user identifier',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    email: {
      label: 'Email',
      description: 'User email address',
      type: 'string',
      format: 'email',
      required: false,
      default: { '@path': '$.traits.email' }
    },
    // ... 20+ more field definitions
    event: {
      label: 'Event Name',
      description: 'Name of the event',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    properties: {
      label: 'Event Properties',
      description: 'Custom properties',
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'When the event occurred',
      type: 'datetime',
      required: false,
      default: { '@path': '$.timestamp' }
    }
    // ... etc
  },
  perform: async (request, { payload, settings }) => {
    // Transform data
    const data = {
      user_id: payload.userId,
      event_name: payload.event,
      event_properties: payload.properties,
      timestamp: payload.timestamp
    }

    // Make request
    return request('https://api.example.com/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      json: data
    })
  },
  performBatch: async (request, { payload, settings }) => {
    // Transform batch
    const events = payload.map((p) => ({
      user_id: p.userId,
      event_name: p.event,
      event_properties: p.properties,
      timestamp: p.timestamp
    }))

    // Make request
    return request('https://api.example.com/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      json: { events }
    })
  }
}

export default action
```

**Total effort:** 10-12 days

---

### ✅ After (With Template)

```typescript
// 60 lines total
import { AnalyticsDestinationBase } from '@segment/destinations-core/templates'

export default class MyAnalytics extends AnalyticsDestinationBase {
  name = 'My Analytics'
  slug = 'my-analytics'

  authentication = {
    scheme: 'custom',
    fields: {
      apiKey: { type: 'password', required: true }
    }
  }

  async track(payload) {
    return this.request('/events', {
      json: {
        user_id: payload.userId,
        event: payload.event,
        properties: payload.properties,
        timestamp: payload.timestamp
      }
    })
  }

  // identify(), page(), group() inherited
  // Fields pre-mapped
  // Batching included
  // Tests included
}
```

**Total effort:** 2-3 days

---

## Time Savings Breakdown

| Task                  | Traditional    | With Template     | Savings |
| --------------------- | -------------- | ----------------- | ------- |
| **Directory setup**   | 30 min         | 5 min (auto)      | 83%     |
| **Authentication**    | 2 hours        | 30 min            | 75%     |
| **Field definitions** | 4 hours        | 0 min (included)  | 100%    |
| **Track action**      | 1 day          | 2 hours           | 75%     |
| **Identify action**   | 1 day          | 0 min (inherited) | 100%    |
| **Page action**       | 1 day          | 0 min (inherited) | 100%    |
| **Group action**      | 1 day          | 0 min (inherited) | 100%    |
| **Batching logic**    | 4 hours        | 0 min (included)  | 100%    |
| **Tests**             | 2 days         | 30 min            | 92%     |
| **Documentation**     | 1 day          | 1 hour            | 87%     |
|                       |                |                   |         |
| **TOTAL**             | **10-12 days** | **2-3 days**      | **75%** |

---

## Real Example: Amplitude Clone

### Traditional Approach: 12 days

```
Day 1-2:   Setup + Authentication
Day 3-4:   Track action (fields + logic + batch)
Day 5-6:   Identify action
Day 7:     Page action
Day 8:     Group action
Day 9-10:  Tests
Day 11:    Documentation
Day 12:    Review & polish
```

### Template Approach: 3 days

```
Day 1 AM:  Generate from template (5 min)
           Configure auth (30 min)
           Implement track() (3 hours)

Day 1 PM:  Test track() (1 hour)
           Deploy track() (30 min)

Day 2 AM:  Review inherited actions (1 hour)
           Customize if needed (2 hours)

Day 2 PM:  Run full test suite (1 hour)
           Documentation review (1 hour)

Day 3:     Final review & deploy
```

**Savings: 9 days (75%)**

---

## Getting Started

### Step 1: Choose Template

```bash
segment-destination create my-platform --interactive
```

### Step 2: Configure Authentication

```typescript
authentication = {
  scheme: 'custom',
  fields: {
    apiKey: { type: 'password', required: true }
  }
}
```

### Step 3: Implement Core Method(s)

```typescript
async track(payload) {
  return this.request('/events', {
    json: { /* transform payload */ }
  })
}
```

### Step 4: Test & Deploy

```bash
npm test
npm run generate:types
```

---

## Common Patterns

### Pattern 1: Simple Analytics

```typescript
class MyAnalytics extends AnalyticsDestinationBase {
  async track(payload) {
    return this.request('/track', {
      json: {
        user: payload.userId,
        event: payload.event,
        props: payload.properties
      }
    })
  }
}
```

### Pattern 2: CRM with Upsert

```typescript
class MyCRM extends CRMDestinationBase {
  async upsertContact(payload) {
    const existing = await this.findContact(payload.email)
    return existing ? this.updateContact(existing.id, payload) : this.createContact(payload)
  }
}
```

### Pattern 3: Audience Sync

```typescript
class MyAudience extends AudienceDestinationBase {
  async createAudience(input) {
    const res = await this.request('/audiences', {
      json: { name: input.audienceName }
    })
    return { externalId: res.data.id }
  }

  async addToAudience(payload) {
    return this.request(`/audiences/${payload.listId}/members`, {
      method: 'POST',
      json: { users: payload.users }
    })
  }
}
```

### Pattern 4: Batch Export

```typescript
class MyExport extends DataExportDestinationBase {
  format = 'csv'

  async uploadBatch(payload) {
    const csv = this.formatAsCSV(payload)
    return this.uploadToS3(this.buildPath(), csv)
  }
}
```

---

## FAQs

### Q: Can I customize the templates?

**A:** Yes! Templates are base classes you inherit from. Override any method:

```typescript
class MyDestination extends AnalyticsDestinationBase {
  // Override track
  async track(payload) {
    // Custom logic
  }

  // Keep inherited identify, page, group
}
```

### Q: What if my destination doesn't fit a template?

**A:** No problem! Templates are optional. You can:

1. Start from scratch (traditional approach)
2. Use utilities à la carte (field library, helpers)
3. Extend the base `DestinationDefinition` class

### Q: Can I add custom fields?

**A:** Absolutely! Add to the inherited fields:

```typescript
fields: {
  ...this.baseFields,  // Inherited
  customField: {       // Your addition
    label: 'Custom',
    type: 'string'
  }
}
```

### Q: How do I handle OAuth2?

**A:** OAuth2 support is built-in:

```typescript
authentication = {
  scheme: 'oauth2',
  refreshAccessToken: async (request, { auth }) => {
    const res = await request('/oauth/refresh', {
      json: { refresh_token: auth.refreshToken }
    })
    return {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token
    }
  }
}
```

### Q: Do templates support batching?

**A:** Yes! Batching is automatic:

```typescript
// Single event (perform)
async track(payload) { /* ... */ }

// Batch (performBatch) - handled automatically
// Or customize:
async trackBatch(payloads) {
  return this.request('/batch', {
    json: { events: payloads.map(this.transform) }
  })
}
```

### Q: How do I test?

**A:** Tests are included:

```bash
npm test                           # Run all tests
npm test -- trackEvent.test.ts     # Run specific test
```

### Q: Can I migrate existing destinations?

**A:** Yes, but not required. Migration is optional for:

- High-maintenance destinations
- Frequently-updated destinations
- Destinations with bugs

---

## Support & Resources

- **Full Strategy Doc:** `DESTINATION_ACCELERATION_STRATEGY.md`
- **Code Examples:** See Appendix A in strategy doc
- **Reference Implementations:** `src/destinations/webhook-extensible/`
- **Questions:** Reach out to Destinations team

---

## Next Steps

1. ✅ Read this guide
2. ✅ Review full strategy document
3. ✅ Try building a destination with a template
4. ✅ Provide feedback
5. ✅ Adopt for your next destination

**Let's build destinations 70% faster! 🚀**
