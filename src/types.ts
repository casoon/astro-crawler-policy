export type BotAction = 'allow' | 'disallow' | 'inherit';

export type ContentSignals = {
  search?: boolean;
  aiInput?: boolean;
  aiTrain?: boolean;
};

export type MergeStrategy = 'replace' | 'prepend' | 'append';

export type Preset =
  | 'seoOnly'
  | 'citationFriendly'
  | 'openToAi'
  | 'blockTraining'
  | 'lockdown';

export type BotCategory =
  | 'search'
  | 'ai-search'
  | 'ai-input'
  | 'ai-training'
  | 'unknown-ai';

export interface RobotsRule {
  userAgent: string | string[];
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
  comment?: string;
}

export interface RegistryBot {
  id: string;
  provider: string;
  userAgents: string[];
  categories: BotCategory[];
  verified?: boolean;
  defaultAction?: BotAction;
}

export interface AstroCrawlerPolicyOptions {
  preset?: Preset;
  mergeStrategy?: MergeStrategy;
  contentSignals?: ContentSignals;
  bots?: Record<string, BotAction>;
  groups?: {
    searchEngines?: BotAction;
    verifiedAi?: BotAction;
    unknownAi?: BotAction;
  };
  rules?: RobotsRule[];
  sitemaps?: string[];
  host?: string;
  output?: {
    robotsTxt?: boolean;
    llmsTxt?: boolean;
  };
  env?: Record<string, Partial<AstroCrawlerPolicyOptions>>;
  audit?: {
    warnOnConflicts?: boolean;
    warnOnMissingSitemap?: boolean;
  };
  debug?: boolean;
  /**
   * Additional bots to add to the built-in registry.
   * Use this to support crawlers not yet included in the default registry.
   */
  extraBots?: RegistryBot[];
}

export interface ResolvedPolicy {
  preset: Preset;
  mergeStrategy: MergeStrategy;
  contentSignals: ContentSignals;
  rules: RobotsRule[];
  botRules: Array<{
    id: string;
    userAgent: string;
    provider: string;
    action: Exclude<BotAction, 'inherit'>;
    categories: BotCategory[];
    verified: boolean;
  }>;
  sitemaps: string[];
  host?: string;
}

export interface CompilePolicyInput {
  options: AstroCrawlerPolicyOptions;
  environment?: string;
  site?: string;
  registry?: RegistryBot[];
}

export interface AuditIssue {
  level: 'info' | 'warn' | 'error';
  code: string;
  message: string;
}

export interface AstroLoggerLike {
  info?: (message: string) => void;
  warn?: (message: string) => void;
  error?: (message: string) => void;
}

export interface AstroConfigLike {
  root?: URL;
  publicDir?: URL;
  site?: URL | string;
}

export interface AstroBuildDoneContextLike {
  dir: URL;
  logger?: AstroLoggerLike;
}
