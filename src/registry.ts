import type { RegistryBot } from './types.js';

/** ISO date of the last registry update. Shown in debug output. */
export const REGISTRY_VERSION = '2026-04-09';

export const defaultRegistry: RegistryBot[] = [
  {
    id: 'GPTBot',
    provider: 'OpenAI',
    userAgents: ['GPTBot'],
    categories: ['ai-training'],
    verified: true
  },
  {
    id: 'OAI-SearchBot',
    provider: 'OpenAI',
    userAgents: ['OAI-SearchBot'],
    categories: ['ai-search', 'ai-input'],
    verified: true
  },
  {
    id: 'ClaudeBot',
    provider: 'Anthropic',
    userAgents: ['ClaudeBot'],
    categories: ['ai-input', 'ai-training'],
    verified: true
  },
  {
    id: 'claude-web',
    provider: 'Anthropic',
    userAgents: ['claude-web'],
    categories: ['ai-input'],
    verified: true
  },
  {
    id: 'Google-Extended',
    provider: 'Google',
    userAgents: ['Google-Extended'],
    categories: ['ai-training'],
    verified: true
  },
  {
    id: 'CCBot',
    provider: 'Common Crawl',
    userAgents: ['CCBot'],
    categories: ['ai-training'],
    verified: true
  },
  {
    id: 'PerplexityBot',
    provider: 'Perplexity',
    userAgents: ['PerplexityBot'],
    categories: ['ai-search', 'ai-input'],
    verified: true
  },
  {
    id: 'Bytespider',
    provider: 'ByteDance',
    userAgents: ['Bytespider'],
    categories: ['ai-training'],
    verified: true
  },
  {
    id: 'meta-externalagent',
    provider: 'Meta',
    userAgents: ['meta-externalagent'],
    categories: ['ai-input', 'ai-training'],
    verified: true
  },
  {
    id: 'Amazonbot',
    provider: 'Amazon',
    userAgents: ['Amazonbot'],
    categories: ['ai-search', 'ai-input'],
    verified: true
  },
  {
    id: 'Applebot-Extended',
    provider: 'Apple',
    userAgents: ['Applebot-Extended'],
    categories: ['ai-training'],
    verified: true
  },
  {
    id: 'Googlebot',
    provider: 'Google',
    userAgents: ['Googlebot'],
    categories: ['search'],
    verified: true
  },
  {
    id: 'Bingbot',
    provider: 'Microsoft',
    userAgents: ['Bingbot'],
    categories: ['search'],
    verified: true
  }
];
