import { describe, expect, it } from 'vitest';
import { auditPolicy } from './audit.js';
import { defaultRegistry } from './registry.js';
import type { ResolvedPolicy } from './types.js';

const basePolicy: ResolvedPolicy = {
  preset: 'citationFriendly',
  mergeStrategy: 'prepend',
  contentSignals: {},
  rules: [{ userAgent: ['*'], allow: ['/'], disallow: [] }],
  botRules: [],
  sitemaps: ['https://example.com/sitemap.xml']
};

describe('auditPolicy', () => {
  it('emits NO_SITEMAP when sitemaps is empty', () => {
    const issues = auditPolicy({ ...basePolicy, sitemaps: [] }, { site: 'https://example.com' });
    expect(issues.some((i) => i.code === 'NO_SITEMAP')).toBe(true);
  });

  it('does not emit NO_SITEMAP when sitemap is present', () => {
    const issues = auditPolicy(basePolicy, { site: 'https://example.com' });
    expect(issues.some((i) => i.code === 'NO_SITEMAP')).toBe(false);
  });

  it('emits MISSING_SITE_URL when site is not provided', () => {
    const issues = auditPolicy(basePolicy, {});
    expect(issues.some((i) => i.code === 'MISSING_SITE_URL')).toBe(true);
  });

  it('does not emit MISSING_SITE_URL when site is provided', () => {
    const issues = auditPolicy(basePolicy, { site: 'https://example.com' });
    expect(issues.some((i) => i.code === 'MISSING_SITE_URL')).toBe(false);
  });

  it('emits DUPLICATE_USER_AGENT_RULE on duplicate user agents', () => {
    const policy: ResolvedPolicy = {
      ...basePolicy,
      rules: [
        { userAgent: ['Googlebot'], allow: ['/'], disallow: [] },
        { userAgent: ['Googlebot'], allow: [], disallow: ['/admin/'] }
      ]
    };
    const issues = auditPolicy(policy, { site: 'https://example.com' });
    expect(issues.some((i) => i.code === 'DUPLICATE_USER_AGENT_RULE')).toBe(true);
  });

  it('emits UNLOCKED_NON_PRODUCTION_ENVIRONMENT for staging without global disallow', () => {
    const issues = auditPolicy(basePolicy, {
      site: 'https://example.com',
      environment: 'staging'
    });
    expect(issues.some((i) => i.code === 'UNLOCKED_NON_PRODUCTION_ENVIRONMENT')).toBe(true);
  });

  it('does not emit UNLOCKED_NON_PRODUCTION_ENVIRONMENT when globally blocked', () => {
    const locked: ResolvedPolicy = {
      ...basePolicy,
      rules: [{ userAgent: ['*'], allow: [], disallow: ['/'] }]
    };
    const issues = auditPolicy(locked, { site: 'https://example.com', environment: 'staging' });
    expect(issues.some((i) => i.code === 'UNLOCKED_NON_PRODUCTION_ENVIRONMENT')).toBe(false);
  });

  it('emits NON_STANDARD_DIRECTIVES when content signals are set', () => {
    const policy = { ...basePolicy, contentSignals: { aiInput: true } };
    const issues = auditPolicy(policy, { site: 'https://example.com' });
    expect(issues.some((i) => i.code === 'NON_STANDARD_DIRECTIVES')).toBe(true);
  });

  it('emits UNKNOWN_BOT_ID for bots not in registry', () => {
    const issues = auditPolicy(basePolicy, {
      site: 'https://example.com',
      registry: defaultRegistry,
      rawOptions: { bots: { UnknownScraper: 'disallow' } }
    });
    expect(issues.some((i) => i.code === 'UNKNOWN_BOT_ID')).toBe(true);
  });

  it('does not emit UNKNOWN_BOT_ID for known bots', () => {
    const issues = auditPolicy(basePolicy, {
      site: 'https://example.com',
      registry: defaultRegistry,
      rawOptions: { bots: { GPTBot: 'disallow' } }
    });
    expect(issues.some((i) => i.code === 'UNKNOWN_BOT_ID')).toBe(false);
  });

  it('emits GROUP_BOT_OVERRIDE_CONFLICT when bot action differs from group', () => {
    const issues = auditPolicy(basePolicy, {
      site: 'https://example.com',
      registry: defaultRegistry,
      rawOptions: {
        groups: { verifiedAi: 'disallow' },
        bots: { ClaudeBot: 'allow' }
      }
    });
    expect(issues.some((i) => i.code === 'GROUP_BOT_OVERRIDE_CONFLICT')).toBe(true);
  });

  it('does not emit GROUP_BOT_OVERRIDE_CONFLICT when bot action matches group', () => {
    const issues = auditPolicy(basePolicy, {
      site: 'https://example.com',
      registry: defaultRegistry,
      rawOptions: {
        groups: { verifiedAi: 'disallow' },
        bots: { ClaudeBot: 'disallow' }
      }
    });
    expect(issues.some((i) => i.code === 'GROUP_BOT_OVERRIDE_CONFLICT')).toBe(false);
  });
});
