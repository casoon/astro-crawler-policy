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

  it('citationFriendly disallows pure training bots by default', () => {
    const policy = compilePolicy({ options: { preset: 'citationFriendly' } });
    const trainingOnly = ['GPTBot', 'Google-Extended', 'CCBot', 'Bytespider', 'Applebot-Extended'];
    for (const id of trainingOnly) {
      const rule = policy.botRules.find((r) => r.id === id);
      expect(rule?.action, `${id} should be disallow`).toBe('disallow');
    }
  });

  it('citationFriendly allows mixed citation+training bots', () => {
    const policy = compilePolicy({ options: { preset: 'citationFriendly' } });
    const mixed = ['ClaudeBot', 'meta-externalagent'];
    for (const id of mixed) {
      const rule = policy.botRules.find((r) => r.id === id);
      expect(rule?.action, `${id} should be allow`).toBe('allow');
    }
  });

  it('blockTraining disallows all bots with training category', () => {
    const policy = compilePolicy({ options: { preset: 'blockTraining' } });
    const allTraining = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Bytespider', 'meta-externalagent', 'Applebot-Extended'];
    for (const id of allTraining) {
      const rule = policy.botRules.find((r) => r.id === id);
      expect(rule?.action, `${id} should be disallow`).toBe('disallow');
    }
  });

  it('applies explicit bot override over group rule', () => {
    const policy = compilePolicy({
      options: {
        preset: 'seoOnly',
        bots: { ClaudeBot: 'allow' }
      }
    });
    const claudeBot = policy.botRules.find((r) => r.id === 'ClaudeBot');
    expect(claudeBot?.action).toBe('allow');
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
