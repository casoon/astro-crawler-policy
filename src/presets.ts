import type { AstroCrawlerPolicyOptions, Preset } from './types.js';

export const presetDefaults: Record<Preset, Partial<AstroCrawlerPolicyOptions>> = {
  seoOnly: {
    contentSignals: {
      search: true,
      aiInput: false,
      aiTrain: false
    },
    groups: {
      searchEngines: 'allow',
      verifiedAi: 'disallow',
      unknownAi: 'disallow'
    }
  },
  citationFriendly: {
    contentSignals: {
      search: true,
      aiInput: true,
      aiTrain: false
    },
    groups: {
      searchEngines: 'allow',
      verifiedAi: 'allow',
      unknownAi: 'disallow'
    },
    bots: {
      GPTBot: 'disallow',
      'Google-Extended': 'disallow',
      CCBot: 'disallow',
      Bytespider: 'disallow',
      'Applebot-Extended': 'disallow'
    }
  },
  openToAi: {
    contentSignals: {
      search: true,
      aiInput: true,
      aiTrain: true
    },
    groups: {
      searchEngines: 'allow',
      verifiedAi: 'allow',
      unknownAi: 'allow'
    }
  },
  blockTraining: {
    contentSignals: {
      search: true,
      aiInput: true,
      aiTrain: false
    },
    groups: {
      searchEngines: 'allow',
      verifiedAi: 'allow',
      unknownAi: 'disallow'
    },
    bots: {
      GPTBot: 'disallow',
      ClaudeBot: 'disallow',
      'Google-Extended': 'disallow',
      CCBot: 'disallow',
      Bytespider: 'disallow',
      'meta-externalagent': 'disallow',
      'Applebot-Extended': 'disallow'
    }
  },
  lockdown: {
    contentSignals: {
      search: false,
      aiInput: false,
      aiTrain: false
    },
    groups: {
      searchEngines: 'disallow',
      verifiedAi: 'disallow',
      unknownAi: 'disallow'
    },
    rules: [
      {
        userAgent: '*',
        disallow: ['/']
      }
    ]
  }
};
