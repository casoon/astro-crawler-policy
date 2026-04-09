import { compilePolicy } from './compile.js';
import { mergeRobotsTxt } from './merge.js';
import { renderRobotsTxt } from './render.js';
import type { AstroCrawlerPolicyOptions } from './types.js';

export function generateRobotsTxt(input: {
  options: AstroCrawlerPolicyOptions;
  existingRobotsTxt?: string | null;
  environment?: string;
  site?: string;
}): { content: string; policy: ReturnType<typeof compilePolicy> } {
  const policy = compilePolicy({
    options: input.options,
    environment: input.environment,
    site: input.site
  });

  const generated = renderRobotsTxt(policy);
  const content = mergeRobotsTxt(
    generated,
    input.existingRobotsTxt ?? null,
    policy.mergeStrategy
  );

  return { content, policy };
}
