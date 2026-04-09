export { auditPolicy } from './audit.js';
export { compilePolicy } from './compile.js';
export { generateRobotsTxt } from './generate.js';
export { defaultRegistry, REGISTRY_VERSION } from './registry.js';
export { mergeRobotsTxt } from './merge.js';
export { presetDefaults } from './presets.js';
export { renderLlmsTxt, renderRobotsTxt } from './render.js';
export type {
  AstroCrawlerPolicyOptions,
  AuditIssue,
  BotAction,
  BotCategory,
  ContentSignals,
  MergeStrategy,
  Preset,
  RegistryBot,
  ResolvedPolicy,
  RobotsRule
} from './types.js';

export { default } from './integration.js';
