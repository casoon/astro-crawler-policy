# @casoon/astro-crawler-policy

Policy-first crawler control for Astro. Generates `robots.txt` (and optionally `llms.txt`) from a typed configuration at build time.

## What it does

- Generates `robots.txt` from a typed configuration — no manual file editing required
- Applies one of five built-in **presets** covering the most common use cases
- Supports **content signals** (`search`, `ai-input`, `ai-train`) for newer crawler directives
- Includes a **bot registry** with 13 known crawlers for per-bot and group-based rules
- **Merges** the generated output with an existing `public/robots.txt` (replace / prepend / append)
- Runs **build-time audits** that warn about common misconfigurations
- Optionally generates **`llms.txt`** — a markdown summary of the AI content policy
- Supports **environment-specific overrides** (e.g. lockdown on staging)

This plugin renders crawler policy. It does not enforce blocking at the network, WAF, or edge layer.

## Installation

```sh
npm install @casoon/astro-crawler-policy
```

## Quick start

```ts
// astro.config.ts
import { defineConfig } from 'astro/config';
import crawlerPolicy from '@casoon/astro-crawler-policy';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    crawlerPolicy({
      preset: 'citationFriendly',
      sitemaps: ['/sitemap-index.xml']
    })
  ]
});
```

The plugin hooks into `astro:build:done` and writes `dist/robots.txt`. With just these two options you get sensible defaults: search engines allowed, verified AI bots allowed for citation, AI training bots blocked.

## Presets

Presets are the primary way to express intent. Each preset sets default content signals and group-level rules.

| Preset | Search | AI citation | AI training | Unknown AI |
|---|---|---|---|---|
| `seoOnly` | allow | disallow | disallow | disallow |
| `citationFriendly` *(default)* | allow | allow | disallow | disallow |
| `openToAi` | allow | allow | allow | allow |
| `blockTraining` | allow | allow | disallow | disallow |
| `lockdown` | disallow | disallow | disallow | disallow |

`blockTraining` additionally adds explicit `Disallow` rules for GPTBot, Google-Extended, and CCBot on top of the group-level setting.

`lockdown` adds a global `User-agent: * / Disallow: /` rule, overriding everything.

## Content signals

Content signals are non-standard directives appended to the wildcard `User-agent: *` block:

```
Content-signal: search=yes, ai-input=yes, ai-train=no
```

They communicate intent to crawlers that support them. The three signals map to:

| Signal | Meaning |
|---|---|
| `search` | Indexing for traditional search engines |
| `aiInput` | Using content as input for AI responses (citation, summarization) |
| `aiTrain` | Using content as AI training data |

Content signals are not yet a web standard. Google Search Console may flag them as unrecognised directives — the audit system emits an `info` message when they are present.

Each preset sets default values for all three signals. You can override them individually:

```ts
crawlerPolicy({
  preset: 'citationFriendly',
  contentSignals: {
    aiTrain: true  // override just this one; search and aiInput come from the preset
  }
})
```

## Groups and per-bot rules

Rules are resolved in layers, from least to most specific:

1. **Preset** — sets group-level defaults
2. **`groups`** — overrides for entire bot categories
3. **`bots`** — overrides for individual bots by registry ID

A bot's final action is the most specific rule that applies to it. An explicit entry in `bots` always wins over a `groups` setting.

```ts
crawlerPolicy({
  preset: 'citationFriendly',

  // Override an entire group
  groups: {
    searchEngines: 'allow',  // default
    verifiedAi: 'allow',     // default
    unknownAi: 'disallow'    // default
  },

  // Override individual bots (takes precedence over groups)
  bots: {
    GPTBot: 'disallow',   // blocks this bot even if verifiedAi is 'allow'
    ClaudeBot: 'allow'    // allows this bot even if verifiedAi were 'disallow'
  }
})
```

The three groups are:
- **`searchEngines`** — bots with category `search` (Googlebot, Bingbot)
- **`verifiedAi`** — verified bots with AI categories (`ai-search`, `ai-input`, `ai-training`)
- **`unknownAi`** — unverified bots or bots with category `unknown-ai`

When a bot's action resolves to `'inherit'` (no group or preset covers it), the bot is omitted from the output.

## Custom rules

For anything not covered by the preset or registry, use `rules` to add raw robots.txt directives:

```ts
crawlerPolicy({
  rules: [
    {
      userAgent: '*',
      disallow: ['/admin/', '/internal/'],
      crawlDelay: 2
    },
    {
      userAgent: 'Slurp',
      disallow: ['/']
    }
  ]
})
```

A `userAgent: '*'` rule in `rules` is merged with the wildcard block that the preset generates — it does not create a second `User-agent: *` section.

Available fields per rule:

| Field | Type | Description |
|---|---|---|
| `userAgent` | `string \| string[]` | One or more User-agent values |
| `allow` | `string[]` | Paths to allow |
| `disallow` | `string[]` | Paths to disallow |
| `crawlDelay` | `number` | Crawl-delay in seconds |
| `comment` | `string` | Inline comment above the rule |

## Merge strategy

When a `public/robots.txt` already exists, the merge strategy controls how it is combined with the generated output.

| Strategy | Result |
|---|---|
| `prepend` *(default)* | Generated output first, then existing file |
| `append` | Existing file first, then generated output |
| `replace` | Generated output only, existing file ignored |

```ts
crawlerPolicy({
  mergeStrategy: 'prepend'
})
```

Use `prepend` to let the generated policy take precedence. Use `append` to keep hand-written rules at the top. Use `replace` when you want full control from config and no manual overrides.

## Environment overrides

The plugin detects the current environment from these variables, in order:

1. `CONTEXT` (Netlify)
2. `DEPLOYMENT_ENVIRONMENT`
3. `NODE_ENV`
4. Falls back to `'production'`

Use `env` to apply different settings per environment:

```ts
crawlerPolicy({
  preset: 'citationFriendly',
  env: {
    staging: { preset: 'lockdown' },
    preview: { preset: 'lockdown' }
  }
})
```

Any option can be overridden per environment. Nested objects (`contentSignals`, `bots`, `groups`) are merged — not replaced — with the base config.

## Output files

```ts
crawlerPolicy({
  output: {
    robotsTxt: true,  // default — writes dist/robots.txt
    llmsTxt: true     // opt-in — writes dist/llms.txt
  }
})
```

### llms.txt

When `output.llmsTxt: true` is set, the plugin generates `dist/llms.txt` alongside `robots.txt`. The file is a Markdown summary of the AI content policy — which crawlers are allowed or blocked, what signals are active, and where the sitemap is:

```md
# example.com

> AI content access policy for example.com.
> Generated by @casoon/astro-crawler-policy (preset: citationFriendly).

## Content Policy

- Search indexing: allowed
- AI citation and summarization: allowed
- AI training data collection: not allowed

## AI Systems

### Allowed
- OAI-SearchBot (OpenAI)
- ClaudeBot (Anthropic)
- claude-web (Anthropic)
- PerplexityBot (Perplexity)
- meta-externalagent (Meta)
- Amazonbot (Amazon)
- Googlebot (Google)
- Bingbot (Microsoft)

### Blocked
- GPTBot (OpenAI)
- Google-Extended (Google)
- CCBot (Common Crawl)
- Bytespider (ByteDance)
- Applebot-Extended (Apple)

## Sitemaps

- https://example.com/sitemap-index.xml
```

## Debug mode

Set `debug: true` to print the resolved configuration to the build log:

```ts
crawlerPolicy({ debug: true })
```

Build output:

```
[@casoon/astro-crawler-policy] [debug] registry version: 2026-04-09
[@casoon/astro-crawler-policy] [debug] environment: production
[@casoon/astro-crawler-policy] [debug] preset: citationFriendly
[@casoon/astro-crawler-policy] [debug] content signals: search=yes, aiInput=yes, aiTrain=no
[@casoon/astro-crawler-policy] [debug] bot: GPTBot → disallow
[@casoon/astro-crawler-policy] [debug] bot: OAI-SearchBot → allow
...
[@casoon/astro-crawler-policy] [debug] sitemap: https://example.com/sitemap-index.xml
```

## Bot registry

The following bots are known and can be referenced by ID in `bots: {}`:

| ID | Provider | Categories | Group |
|---|---|---|---|
| `GPTBot` | OpenAI | ai-training | verifiedAi |
| `OAI-SearchBot` | OpenAI | ai-search, ai-input | verifiedAi |
| `ClaudeBot` | Anthropic | ai-input, ai-training | verifiedAi |
| `claude-web` | Anthropic | ai-input | verifiedAi |
| `Google-Extended` | Google | ai-training | verifiedAi |
| `CCBot` | Common Crawl | ai-training | verifiedAi |
| `PerplexityBot` | Perplexity | ai-search, ai-input | verifiedAi |
| `Bytespider` | ByteDance | ai-training | verifiedAi |
| `meta-externalagent` | Meta | ai-input, ai-training | verifiedAi |
| `Amazonbot` | Amazon | ai-search, ai-input | verifiedAi |
| `Applebot-Extended` | Apple | ai-training | verifiedAi |
| `Googlebot` | Google | search | searchEngines |
| `Bingbot` | Microsoft | search | searchEngines |

## Extending the registry

The built-in registry covers the most common crawlers. To support bots not yet listed, use `extraBots`:

```ts
crawlerPolicy({
  extraBots: [
    {
      id: 'MyCustomBot',
      provider: 'Acme Corp',
      userAgents: ['MyCustomBot/1.0'],
      categories: ['ai-training'],
      verified: true
    }
  ],
  bots: {
    MyCustomBot: 'disallow'
  }
})
```

Extra bots participate in group rules, per-bot overrides, audit checks, and `llms.txt` output — the same as built-in bots.

**Keeping the registry up to date:** The registry ships as part of the package. As new crawlers emerge, updates are released as patch versions. Run `npm update @casoon/astro-crawler-policy` to get the latest bot data. The `REGISTRY_VERSION` export contains the date of the last registry update.

## Audit warnings

The plugin emits warnings and info messages during the build:

| Code | Level | Condition |
|---|---|---|
| `MISSING_SITE_URL` | warn | No `site` set in Astro config |
| `NO_SITEMAP` | info | No sitemaps configured |
| `DUPLICATE_USER_AGENT_RULE` | warn | Two rules share the same User-agent |
| `UNLOCKED_NON_PRODUCTION_ENVIRONMENT` | warn | Staging/preview not globally blocked |
| `NON_STANDARD_DIRECTIVES` | info | Content signals may trigger GSC syntax warnings |
| `AI_INPUT_WITHOUT_ALLOWED_BOTS` | warn | `aiInput` enabled but all AI bots blocked |
| `UNKNOWN_BOT_ID` | warn | A bot ID in `bots: {}` is not in the registry |
| `GROUP_BOT_OVERRIDE_CONFLICT` | info | Bot override contradicts its group rule |

Audit settings:

```ts
crawlerPolicy({
  audit: {
    warnOnMissingSitemap: true,  // default
    warnOnConflicts: true        // default
  }
})
```

## Programmatic usage

The core modules are exported for use outside of the Astro integration:

```ts
import {
  compilePolicy,
  renderRobotsTxt,
  renderLlmsTxt,
  auditPolicy,
  defaultRegistry,
  REGISTRY_VERSION
} from '@casoon/astro-crawler-policy';

const policy = compilePolicy({
  options: { preset: 'citationFriendly', sitemaps: ['/sitemap-index.xml'] },
  site: 'https://example.com',
  environment: 'production'
});

const robotsTxt = renderRobotsTxt(policy);
const llmsTxt = renderLlmsTxt(policy, 'https://example.com');
const issues = auditPolicy(policy, { site: 'https://example.com', registry: defaultRegistry });
```

## Generated output examples

### citationFriendly (default)

```ts
crawlerPolicy({
  preset: 'citationFriendly',
  sitemaps: ['/sitemap-index.xml']
})
```

```
# Generated by @casoon/astro-crawler-policy
# preset: citationFriendly

User-agent: *
Allow: /
Content-signal: search=yes, ai-input=yes, ai-train=no

User-agent: GPTBot
Disallow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: claude-web
Allow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bytespider
Disallow: /

User-agent: meta-externalagent
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://example.com/sitemap-index.xml
```

### seoOnly

```ts
crawlerPolicy({ preset: 'seoOnly' })
```

```
# Generated by @casoon/astro-crawler-policy
# preset: seoOnly

User-agent: *
Allow: /
Content-signal: search=yes, ai-input=no, ai-train=no

User-agent: GPTBot
Disallow: /

User-agent: OAI-SearchBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: claude-web
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: meta-externalagent
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /
```

### lockdown (staging/preview)

```ts
crawlerPolicy({
  env: {
    staging: { preset: 'lockdown' },
    preview: { preset: 'lockdown' }
  }
})
```

When `CONTEXT=staging` or `NODE_ENV=staging`:

```
# Generated by @casoon/astro-crawler-policy
# preset: lockdown

User-agent: *
Disallow: /
Content-signal: search=no, ai-input=no, ai-train=no
```
