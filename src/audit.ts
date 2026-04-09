import type { AstroCrawlerPolicyOptions, AuditIssue, RegistryBot, ResolvedPolicy } from './types.js';

function hasDuplicateUserAgents(policy: ResolvedPolicy): boolean {
  const seen = new Set<string>();

  for (const rule of policy.rules) {
    const agents = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent];

    for (const userAgent of agents) {
      const key = userAgent.toLowerCase();

      if (seen.has(key)) {
        return true;
      }

      seen.add(key);
    }
  }

  return false;
}

export function auditPolicy(
  policy: ResolvedPolicy,
  options: {
    site?: string;
    environment?: string;
    registry?: RegistryBot[];
    rawOptions?: AstroCrawlerPolicyOptions;
    warnOnMissingSitemap?: boolean;
    warnOnConflicts?: boolean;
  } = {}
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const allowedAiBots = policy.botRules.filter((rule) => rule.action === 'allow');
  const blockedAiBots = policy.botRules.filter((rule) => rule.action === 'disallow');
  const registry = options.registry ?? [];
  const rawOptions = options.rawOptions;

  if (policy.contentSignals.aiInput && allowedAiBots.length === 0 && blockedAiBots.length > 0) {
    issues.push({
      level: 'warn',
      code: 'AI_INPUT_WITHOUT_ALLOWED_BOTS',
      message: 'ai-input is enabled, but all known AI bots are blocked.'
    });
  }

  if (options.warnOnMissingSitemap !== false && policy.sitemaps.length === 0) {
    issues.push({
      level: 'info',
      code: 'NO_SITEMAP',
      message: 'No sitemap configured. This reduces discoverability for crawlers.'
    });
  }

  if (!options.site) {
    issues.push({
      level: 'warn',
      code: 'MISSING_SITE_URL',
      message: 'No site URL found. Relative sitemap entries may be incomplete.'
    });
  }

  if (hasDuplicateUserAgents(policy)) {
    issues.push({
      level: 'warn',
      code: 'DUPLICATE_USER_AGENT_RULE',
      message: 'Multiple rules share the same User-agent. This may result in conflicting behavior.'
    });
  }

  if (
    ['preview', 'staging'].includes(options.environment ?? '') &&
    !policy.rules.some((rule) => {
      const agents = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent];
      return agents.includes('*') && rule.disallow?.includes('/');
    })
  ) {
    issues.push({
      level: 'warn',
      code: 'UNLOCKED_NON_PRODUCTION_ENVIRONMENT',
      message: 'Preview or staging environment is not globally blocked with Disallow: /.'
    });
  }

  if (
    policy.contentSignals.search !== undefined ||
    policy.contentSignals.aiInput !== undefined ||
    policy.contentSignals.aiTrain !== undefined
  ) {
    issues.push({
      level: 'info',
      code: 'NON_STANDARD_DIRECTIVES',
      message: 'Newer directives like Content-signal may trigger syntax warnings in tools like GSC.'
    });
  }

  if (rawOptions?.bots && registry.length > 0) {
    const knownIds = new Set(registry.map((b) => b.id));

    for (const id of Object.keys(rawOptions.bots)) {
      if (!knownIds.has(id)) {
        issues.push({
          level: 'warn',
          code: 'UNKNOWN_BOT_ID',
          message: `Bot ID "${id}" is not in the registry and will have no effect.`
        });
      }
    }
  }

  if (options.warnOnConflicts !== false && rawOptions?.bots && rawOptions?.groups && registry.length > 0) {
    for (const [id, explicitAction] of Object.entries(rawOptions.bots)) {
      if (explicitAction === 'inherit') continue;

      const bot = registry.find((b) => b.id === id);
      if (!bot) continue;

      let groupAction: string | undefined;

      if (bot.verified === false && rawOptions.groups.unknownAi) {
        groupAction = rawOptions.groups.unknownAi;
      } else if (bot.categories.includes('search') && rawOptions.groups.searchEngines) {
        groupAction = rawOptions.groups.searchEngines;
      } else if (
        bot.verified &&
        bot.categories.some((c) => ['ai-search', 'ai-input', 'ai-training'].includes(c)) &&
        rawOptions.groups.verifiedAi
      ) {
        groupAction = rawOptions.groups.verifiedAi;
      } else if (bot.categories.includes('unknown-ai') && rawOptions.groups.unknownAi) {
        groupAction = rawOptions.groups.unknownAi;
      }

      if (groupAction && groupAction !== explicitAction) {
        issues.push({
          level: 'info',
          code: 'GROUP_BOT_OVERRIDE_CONFLICT',
          message: `Bot "${id}" is explicitly set to "${explicitAction}" but its group rule says "${groupAction}".`
        });
      }
    }
  }

  return issues;
}
