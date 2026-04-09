import { describe, expect, it } from 'vitest';
import { compilePolicy } from './compile.js';

describe('compilePolicy', () => {
  it('defaults to citationFriendly when no preset given', () => {
    const policy = compilePolicy({ options: {} });
    expect(policy.preset).toBe('citationFriendly');
  });

  it('applies seoOnly preset', () => {
    const policy = compilePolicy({ options: { preset: 'seoOnly' } });
    expect(policy.preset).toBe('seoOnly');
    expect(policy.contentSignals.search).toBe(true);
    expect(policy.contentSignals.aiTrain).toBe(false);
  });

  it('merges env override when environment matches', () => {
    const policy = compilePolicy({
      options: {
        preset: 'citationFriendly',
        env: { staging: { preset: 'lockdown' } }
      },
      environment: 'staging'
    });
    expect(policy.preset).toBe('lockdown');
  });

  it('ignores env override when environment does not match', () => {
    const policy = compilePolicy({
      options: {
        preset: 'citationFriendly',
        env: { staging: { preset: 'lockdown' } }
      },
      environment: 'production'
    });
    expect(policy.preset).toBe('citationFriendly');
  });

  it('applies explicit bot override over group rule', () => {
    const policy = compilePolicy({
      options: {
        preset: 'citationFriendly',
        bots: { GPTBot: 'disallow' }
      }
    });
    const gptBot = policy.botRules.find((r) => r.id === 'GPTBot');
    expect(gptBot?.action).toBe('disallow');
  });

  it('throws on unknown preset', () => {
    expect(() =>
      compilePolicy({ options: { preset: 'invalid' as never } })
    ).toThrow('Unknown preset');
  });

  it('passes host through to resolved policy', () => {
    const policy = compilePolicy({ options: { host: 'example.com' } });
    expect(policy.host).toBe('example.com');
  });

  it('resolves absolute sitemap URLs unchanged', () => {
    const policy = compilePolicy({
      options: { sitemaps: ['https://example.com/sitemap.xml'] }
    });
    expect(policy.sitemaps).toContain('https://example.com/sitemap.xml');
  });

  it('resolves relative sitemaps against site', () => {
    const policy = compilePolicy({
      options: { sitemaps: ['/sitemap.xml'] },
      site: 'https://example.com'
    });
    expect(policy.sitemaps).toContain('https://example.com/sitemap.xml');
  });
});
