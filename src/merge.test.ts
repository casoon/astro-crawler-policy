import { describe, expect, it } from 'vitest';
import { mergeRobotsTxt } from './merge.js';

const generated = 'User-agent: *\nAllow: /\n';
const existing = 'User-agent: Googlebot\nDisallow: /admin/\n';

describe('mergeRobotsTxt', () => {
  it('replace returns only generated content', () => {
    const result = mergeRobotsTxt(generated, existing, 'replace');
    expect(result).toBe(generated);
    expect(result).not.toContain('Googlebot');
  });

  it('prepend places generated before existing', () => {
    const result = mergeRobotsTxt(generated, existing, 'prepend');
    expect(result.indexOf('Allow: /')).toBeLessThan(result.indexOf('Googlebot'));
  });

  it('append places existing before generated', () => {
    const result = mergeRobotsTxt(generated, existing, 'append');
    expect(result.indexOf('Googlebot')).toBeLessThan(result.indexOf('Allow: /'));
  });

  it('returns generated when existing is null', () => {
    const result = mergeRobotsTxt(generated, null, 'prepend');
    expect(result).toBe(generated);
  });

  it('returns generated when existing is empty', () => {
    const result = mergeRobotsTxt(generated, '   ', 'append');
    expect(result).toBe(generated);
  });

  it('ensures output ends with newline', () => {
    const result = mergeRobotsTxt('User-agent: *', null, 'replace');
    expect(result.endsWith('\n')).toBe(true);
  });
});
