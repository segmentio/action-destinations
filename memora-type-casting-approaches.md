# Memora Trait Type Casting - Implementation Approaches

**Date:** March 3, 2026
**Project:** Memora Destination - Segment Actions
**Purpose:** Evaluate different approaches for handling trait type conversion when syncing data to Memora

---

## Problem Statement

Memora traits have specific data types (STRING, NUMBER, BOOLEAN, DATE) that must be respected when sending data. Segment events contain string values that need to be converted to the correct type. We need to determine the best approach to obtain trait type information and perform conversions at runtime.

---

## Approach 1: User-Selected Types (Current Implementation)

### Description

Users explicitly select the trait type for each field mapping through a dropdown interface with hardcoded type options (STRING, NUMBER, BOOLEAN, DATE).

### How It Works

- Contact traits field is an array of objects
- Each mapping contains: `trait_name`, `trait_type`, `value`
- Trait type is selected from a predefined dropdown
- Type conversion happens at runtime based on user selection

### Advantages

✅ **No Runtime API Calls** - Zero performance overhead
✅ **No External Dependencies** - No Redis or caching infrastructure needed
✅ **Immediate Availability** - Works out of the box
✅ **User Control** - Users explicitly define expected types
✅ **Simple Architecture** - Straightforward implementation
✅ **Cost Effective** - No additional infrastructure costs
✅ **Portable** - Works across all environments without setup

### Disadvantages

❌ **Manual Configuration** - Users must select type for each trait
❌ **Error Prone** - Users might select wrong type
❌ **Schema Drift** - User selections can become stale if Memora schema changes
❌ **Extra UI Steps** - More fields to configure per trait
❌ **No Validation** - Type selection not validated against actual Memora schema
❌ **Maintenance Burden** - Users responsible for keeping types in sync

### Implementation Complexity

**Low** - Single code change, no infrastructure

### Maintenance Burden

**Low** - Stable implementation, no external dependencies

---

## Approach 2: Fetch Trait Info Before Request

### Description

Fetch trait schema from Memora API at runtime before processing each batch of events. Cache the schema in memory with TTL to reduce API calls.

### How It Works

- When `perform()` executes, check in-memory cache for trait schema
- If cache miss or expired, make API call to fetch trait definitions
- Cache response for 1 hour (or configurable TTL)
- Use cached schema to convert trait values to correct types
- Cache is per-instance, lost on service restart

### Advantages

✅ **Accurate Schema** - Always uses real Memora trait definitions
✅ **Auto-Discovery** - No user configuration of types needed
✅ **Schema Validation** - Can validate against actual Memora schema
✅ **Reduced API Calls** - Caching minimizes performance impact
✅ **Self-Healing** - Automatically picks up schema changes after TTL
✅ **No User Error** - Eliminates possibility of user selecting wrong type

### Disadvantages

❌ **Runtime API Calls** - Initial call per store per instance adds latency
❌ **Cache Limitations** - Cache lost on restarts, not shared across instances
❌ **Cold Start Penalty** - First batch after restart slower
❌ **Rate Limits** - Could hit Memora API rate limits with many stores
❌ **Failure Mode** - If fetch fails, events are blocked
❌ **Memory Usage** - Cache consumes memory for trait schemas
❌ **Complexity** - Need cache invalidation, TTL management, error handling

### Implementation Complexity

**Medium** - In-memory cache, TTL management, error handling

### Maintenance Burden

**Medium** - Need to monitor cache effectiveness, tune TTL

---

## Approach 3: Redis Cache

### Description

Store trait schemas in Redis with TTL. Share cache across all service instances to minimize API calls and improve consistency.

### How It Works

- On first request for a store, fetch trait schema from Memora API
- Store schema in Redis with configurable TTL (e.g., 1 hour)
- All instances read from shared Redis cache
- Background job can warm cache proactively
- Support manual cache invalidation if needed

### Advantages

✅ **Shared Cache** - All instances benefit from cached data
✅ **Persistent Cache** - Survives service restarts
✅ **Minimal API Calls** - Only one fetch per store per TTL across entire cluster
✅ **Accurate Schema** - Uses real Memora trait definitions
✅ **Scalable** - Handles high volume efficiently
✅ **Cache Warming** - Can preload cache for known stores
✅ **Manual Control** - Support cache invalidation when needed

### Disadvantages

❌ **Infrastructure Required** - Needs Redis deployment and management
❌ **Operational Overhead** - Monitor Redis health, handle failures
❌ **Complexity** - Connection management, retry logic, fallback strategy
❌ **Cost** - Additional infrastructure costs for Redis
❌ **Network Dependency** - Redis network calls add latency
❌ **Failure Mode** - Need fallback if Redis unavailable
❌ **Schema Staleness** - Data could be stale until TTL expires
❌ **Security** - Need secure Redis access controls

### Implementation Complexity

**High** - Redis setup, connection pooling, error handling, fallback logic

### Maintenance Burden

**High** - Monitor Redis, handle failures, tune cache settings, manage infrastructure

---

## Approach 4: Memora API Native Support

### Description

Memora team adds native type conversion support to their API. API accepts any value type and converts based on trait schema automatically.

### How It Works

- Send trait values as-is (strings, numbers, booleans)
- Memora API looks up trait schema internally
- API performs type conversion/validation server-side
- Returns clear error messages for type mismatches
- No client-side type handling needed

### Advantages

✅ **Zero Implementation** - No Segment-side code changes needed
✅ **Authoritative Source** - Memora is source of truth for schema
✅ **No Caching Needed** - Memora handles schema internally
✅ **Best Performance** - No additional API calls or cache lookups
✅ **No Schema Drift** - Always current schema
✅ **Simplified Client** - Segment just passes through values
✅ **Better Error Messages** - API can provide specific type errors
✅ **Works for All Clients** - Benefits all API consumers, not just Segment

### Disadvantages

❌ **External Dependency** - Relies on Memora team implementation
❌ **Timeline Uncertainty** - No control over when feature is available
❌ **Blocked Implementation** - Can't proceed without Memora changes
❌ **API Version Management** - May require API version upgrades
❌ **Potential Breaking Changes** - Memora API changes could break integration
❌ **Limited Control** - Can't customize conversion logic if needed

### Implementation Complexity

**Zero** (Segment side) / **Unknown** (Memora side)

### Maintenance Burden

**Zero** (after Memora implements)

---

## Comparison Matrix

| Criteria                   | Approach 1: User-Selected | Approach 2: Runtime Fetch | Approach 3: Redis Cache | Approach 4: API Native |
| -------------------------- | ------------------------- | ------------------------- | ----------------------- | ---------------------- |
| **Runtime Performance**    | Excellent                 | Good                      | Very Good               | Excellent              |
| **Accuracy**               | User-dependent            | High                      | High                    | Perfect                |
| **Implementation Time**    | 1 day                     | 3-5 days                  | 1-2 weeks               | Unknown                |
| **Infrastructure Cost**    | None                      | None                      | Medium                  | None                   |
| **Operational Complexity** | Low                       | Medium                    | High                    | Low                    |
| **Schema Freshness**       | Manual                    | 1 hour                    | 1 hour                  | Real-time              |
| **User Experience**        | More steps                | Automatic                 | Automatic               | Automatic              |
| **Failure Risk**           | Low                       | Medium                    | High                    | Low                    |

---

## Recommended Approach

### Short-term (Immediate Implementation)

**Approach 1: User-Selected Types**

**Rationale:**

- Can be deployed immediately
- No infrastructure dependencies
- Low risk, simple to maintain
- Provides immediate value to customers
- Can be replaced later if needed

### Long-term (Ideal Solution)

**Approach 4: API Native Support**

**Rationale:**

- Best customer experience
- Zero maintenance burden
- Most accurate and reliable
- Benefits entire Memora ecosystem

### Recommended Path Forward

1. **Phase 1 (Now):** Implement Approach 1 (User-Selected Types)

   - Deploy working solution immediately
   - Gather user feedback on UX
   - Monitor for type-related errors

2. **Phase 2 (3-6 months):** Engage Memora Team on Approach 4

   - Present use case for native type support
   - Discuss API enhancement timeline
   - Plan migration strategy

3. **Phase 3 (If Needed):** Consider Approach 2 as interim solution

   - If Approach 4 takes >6 months
   - If user feedback shows Approach 1 is too error-prone
   - Implement in-memory caching to reduce friction

4. **Phase 4 (When Ready):** Migrate to Approach 4
   - Remove client-side type handling
   - Simplify configuration UI
   - Document migration for existing customers

---

## Decision Factors

Choose **Approach 1** if:

- Need solution immediately
- Want zero operational overhead
- Acceptable for users to configure types
- Schema changes are infrequent

Choose **Approach 2** if:

- Schema accuracy is critical
- Users shouldn't manage types
- Can accept slight performance impact
- Don't want infrastructure complexity

Choose **Approach 3** if:

- High volume with many stores
- Need consistent cache across instances
- Have Redis infrastructure already
- Can manage additional complexity

Choose **Approach 4** if:

- Can wait for Memora team implementation
- Want long-term optimal solution
- Need perfect schema accuracy
- Want to minimize Segment-side complexity

---

## Conclusion

The recommended strategy is to implement **Approach 1** immediately as it provides working functionality with minimal complexity, while pursuing **Approach 4** with the Memora team as the long-term solution. This pragmatic approach delivers immediate value while working toward the ideal architecture.
