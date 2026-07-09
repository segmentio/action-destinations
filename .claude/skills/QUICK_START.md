# Quick Start Guide - Destination Generator Skills

## Fastest path: `/orchestrate` (recommended)

Run the whole pipeline with one command and just answer the prompts:

```
/orchestrate <destination-name>
```

You'll be asked for the **API source** (a docs URL, an OpenAPI spec path, or a PRD) and an **output directory** (default `/tmp/<slug>/`). The orchestrator then runs all 7 steps — refine → map → spec → generate → local e2e → deploy staging → staging e2e — pausing for your review between each.

```
refined-actions → endpoint-mapping → final-spec → code → local e2e → deploy → staging e2e
```

Use the step-by-step paths below if you'd rather drive each skill yourself.

## Choose Your Path

### Path A: I have an OpenAPI specification ✅

```bash
/openapi-analyze
# Provide OpenAPI spec URL or file path
# Review analysis document
/implement-destination
# Select actions and generate code
```

### Path B: I have API documentation on a website 📄

```bash
/web-analyze
# Provide documentation URL
# Review and verify analysis document
/implement-destination
# Select actions and generate code
```

## Three Skills, One Workflow

```
┌─────────────────────────────────────────────────────┐
│                 Analysis Phase                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  /openapi-analyze          /web-analyze             │
│  (OpenAPI specs)           (Website docs)           │
│         │                         │                 │
│         └────────┬────────────────┘                 │
│                  ▼                                   │
│     Standard Analysis Document                      │
│     (.claude/openapi-analyses/                      │
│      [api-name]-analysis.md)                        │
│                                                      │
└──────────────────┬──────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────┐
│             Implementation Phase                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│           /implement-destination                         │
│   (Works with both analysis sources)                │
│                  │                                   │
│                  ▼                                   │
│     Generated Destination Code                      │
│     (packages/destination-actions/                  │
│      src/destinations/[slug]/)                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 5-Minute Walkthrough

### 1. Analyze (2 min)

**For OpenAPI:**

```
/openapi-analyze
→ Enter: https://api.yourservice.com/openapi.json
→ Wait for analysis
```

**For Website Docs:**

```
/web-analyze
→ Enter: https://docs.yourservice.com/api
→ Enter: Your Service API
→ Wait for analysis
```

### 2. Review (1 min)

Open the generated analysis:

```bash
packages/destination-actions/.claude/openapi-analyses/your-service-analysis.md
```

Check:

- ✅ Authentication looks correct
- ✅ High-priority actions make sense
- ✅ Field mappings are reasonable

Shortlist 3-5 actions you want to implement.

### 3. Implement (1 min)

```
/implement-destination
→ Enter analysis path: packages/destination-actions/.claude/openapi-analyses/your-service-analysis.md
→ Enter destination name: Your Service
→ Confirm slug: your-service
→ Enter actions: trackEvent, identifyUser, updateProfile
→ Wait for generation
```

### 4. Complete & Test (30 sec)

```bash
cd packages/destination-actions/src/destinations/your-service
./bin/run generate:types --path packages/destination-actions/src/destinations/your-service/index.ts
yarn build
yarn test packages/destination-actions/src/destinations/your-service
```

Review `IMPLEMENTATION_NOTES.md` for TODOs.

### 5. Done! 🎉

You now have ~70-80% of your destination implemented with clear TODOs for the remaining work.

## Decision Tree

```
Do you have API documentation?
│
├─ Yes, OpenAPI spec → /openapi-analyze
│
├─ Yes, website docs → /web-analyze
│
└─ No documentation → Manual implementation needed
```

## Common Commands

```bash
# Analyze OpenAPI
/openapi-analyze

# Analyze website
/web-analyze

# Generate code
/implement-destination

# After generation - type generation
./bin/run generate:types --path packages/destination-actions/src/destinations/[slug]/index.ts

# Build
yarn build

# Test
yarn test packages/destination-actions/src/destinations/[slug]

# View generated files
ls -la packages/destination-actions/src/destinations/[slug]
```

## What Gets Generated

```
your-destination/
├── index.ts                      ← Destination definition ✅
├── generated-types.ts            ← TypeScript types ✅
├── IMPLEMENTATION_NOTES.md       ← TODOs and guidance ✅
├── __tests__/
│   └── index.test.ts            ← Destination tests ✅
├── track-event/
│   ├── index.ts                 ← Action definition ✅
│   ├── generated-types.ts       ← Action types ✅
│   └── __tests__/
│       └── index.test.ts        ← Action tests ✅
└── identify-user/
    └── ... (same structure)
```

## Tips

### For Best Results

1. **OpenAPI Analyze:**

- Use complete, official OpenAPI specs
- OpenAPI 3.x gives better results than 2.0

2. **Web Analyze:**

- Provide API reference/documentation URLs
- Include authentication/getting-started pages
- Verify extracted information manually

3. **Implement:**

- Start with 3-5 core actions
- Review generated code before TODOs
- Test incrementally

### Troubleshooting

**Issue:** Analysis missed important endpoints
**Fix:** Review analysis doc and add manually, or re-run with additional URLs

**Issue:** Field types are wrong
**Fix:** Edit action `index.ts` and regenerate types

**Issue:** Authentication doesn't work
**Fix:** Check `IMPLEMENTATION_NOTES.md` - likely needs manual testAuthentication implementation

**Issue:** TypeScript errors after generation
**Fix:** Run `./bin/run generate:types` and rebuild

## File Locations

| File                                                      | Purpose                          |
| --------------------------------------------------------- | -------------------------------- |
| `.claude/commands/orchestrate.md`                         | End-to-end pipeline orchestrator |
| `.claude/commands/refined-actions.md`                     | Step 1 — PRD → refined actions   |
| `.claude/commands/endpoint-mapping.md`                    | Step 2 — actions → endpoints     |
| `.claude/commands/spec-generator.md`                      | Step 3 — mapping → spec doc      |
| `.claude/commands/generate-destination.md`                | Step 4 — spec → code + tests     |
| `.claude/skills/README.md`                                | Full documentation               |
| `.claude/skills/QUICK_START.md`                           | This file                        |
| `.claude/skills/openapi-analyze/SKILL.md`                 | OpenAPI analysis skill           |
| `.claude/skills/web-analyze/SKILL.md`                     | Web documentation analysis skill |
| `.claude/skills/implement-destination/SKILL.md`           | Implementation skill             |
| `.claude/skills/implement-destination/analysis-format.md` | Standard format specification    |
| `.claude/skills/implement-destination/templates/`         | Code generation templates        |
| `packages/destination-actions/.claude/openapi-analyses/`  | Generated analysis documents     |

## Support

- Full docs: [.claude/skills/README.md](.claude/skills/README.md)
- Analysis
  format: [.claude/skills/implement-destination/analysis-format.md](.claude/skills/implement-destination/analysis-format.md)
- Implementation notes: Check generated `IMPLEMENTATION_NOTES.md` in your destination folder

---

**Ready to build your first destination? Pick a skill and go! 🚀**
