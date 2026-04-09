import { presetDefaults } from './presets.js';
import { defaultRegistry } from './registry.js';
import type {
  AstroCrawlerPolicyOptions,
  BotAction,
  CompilePolicyInput,
  RegistryBot,
  ResolvedPolicy,
  RobotsRule
} from './types.js';

function mergeOptions(
  base: Partial<AstroCrawlerPolicyOptions>,
  override: Partial<AstroCrawlerPolicyOptions> | undefined
): AstroCrawlerPolicyOptions {
  return {
    ...base,
    ...override,
    contentSignals: {
      ...base.contentSignals,
      ...override?.contentSignals
    },
    bots: {
      ...base.bots,
      ...override?.bots
    },
    groups: {
      ...base.groups,
      ...override?.groups
    },
    output: {
      ...base.output,
      ...override?.output
    },
    audit: {
      ...base.audit,
      ...override?.audit
    },
    rules: override?.rules ?? base.rules,
    sitemaps: override?.sitemaps ?? base.sitemaps
  };
}

function classifyDefaultAction(
  bot: RegistryBot,
  options: AstroCrawlerPolicyOptions
): BotAction {
  if (bot.verified === false && options.groups?.unknownAi) {
    return options.groups.unknownAi;
  }

  if (bot.categories.includes('search') && options.groups?.searchEngines) {
    return options.groups.searchEngines;
  }

  if (
    bot.verified &&
    bot.categories.some((category) =>
      ['ai-search', 'ai-input', 'ai-training'].includes(category)
    ) &&
    options.groups?.verifiedAi
  ) {
    return options.groups.verifiedAi;
  }

  if (bot.categories.includes('unknown-ai') && options.groups?.unknownAi) {
    return options.groups.unknownAi;
  }

  return bot.defaultAction ?? 'inherit';
}

function normalizeRules(rules: RobotsRule[] | undefined): RobotsRule[] {
  return (rules ?? []).map((rule) => ({
    ...rule,
    userAgent: Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent],
    allow: rule.allow ?? [],
    disallow: rule.disallow ?? []
  }));
}

function normalizeSitemaps(site: string | undefined, sitemaps: string[] | undefined): string[] {
  const values = sitemaps ?? [];
  const deduped = new Set<string>();

  for (const sitemap of values) {
    if (/^https?:\/\//.test(sitemap)) {
      deduped.add(sitemap);
      continue;
    }

    if (site) {
      deduped.add(new URL(sitemap, site).toString());
      continue;
    }

    deduped.add(sitemap);
  }

  return [...deduped];
}

export function compilePolicy(input: CompilePolicyInput): ResolvedPolicy {
  const extraBots = input.options.extraBots ?? [];
  const registry = [...(input.registry ?? defaultRegistry), ...extraBots];
  const environment = input.environment;
  const baseOptions = input.options;

  if (baseOptions.preset !== undefined && !Object.prototype.hasOwnProperty.call(presetDefaults, baseOptions.preset)) {
    throw new Error(
      `astro-crawler-policy: Unknown preset "${baseOptions.preset}". Valid presets are: ${Object.keys(presetDefaults).join(', ')}.`
    );
  }

  const basePreset = baseOptions.preset ?? 'citationFriendly';
  const presetOptions = presetDefaults[basePreset] ?? {};
  const withPreset = mergeOptions(presetOptions, baseOptions);
  const withEnv = mergeOptions(withPreset, environment ? withPreset.env?.[environment] : undefined);
  const preset = withEnv.preset ?? basePreset;
  const rules = normalizeRules(withEnv.rules);

  const botRules = registry.flatMap((bot) => {
    const resolvedAction = withEnv.bots?.[bot.id] ?? classifyDefaultAction(bot, withEnv);

    if (resolvedAction === 'inherit') {
      return [];
    }

    return bot.userAgents.map((userAgent) => ({
      id: bot.id,
      userAgent,
      provider: bot.provider,
      action: resolvedAction,
      categories: bot.categories,
      verified: bot.verified ?? false
    }));
  });

  return {
    preset,
    mergeStrategy: withEnv.mergeStrategy ?? 'prepend',
    contentSignals: withEnv.contentSignals ?? {},
    rules,
    botRules,
    sitemaps: normalizeSitemaps(input.site, withEnv.sitemaps),
    host: withEnv.host
  };
}
