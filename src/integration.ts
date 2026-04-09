import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditPolicy } from './audit.js';
import { generateRobotsTxt } from './generate.js';
import { defaultRegistry, REGISTRY_VERSION } from './registry.js';
import { renderLlmsTxt } from './render.js';
import type {
  AstroBuildDoneContextLike,
  AstroConfigLike,
  AstroCrawlerPolicyOptions,
  AstroLoggerLike
} from './types.js';

function logIssue(logger: AstroLoggerLike | undefined, issue: { level: string; message: string }): void {
  if (issue.level === 'error') {
    logger?.error?.(issue.message);
    return;
  }

  if (issue.level === 'warn') {
    logger?.warn?.(issue.message);
    return;
  }

  logger?.info?.(issue.message);
}

async function readOptionalFile(pathname: string): Promise<string | null> {
  try {
    return await readFile(pathname, 'utf8');
  } catch {
    return null;
  }
}

export default function crawlerPolicy(options: AstroCrawlerPolicyOptions = {}) {
  let config: AstroConfigLike | undefined;

  return {
    name: '@casoon/astro-crawler-policy',
    hooks: {
      'astro:config:setup': ({ config: astroConfig, logger }: { config: AstroConfigLike; logger?: AstroLoggerLike }) => {
        config = astroConfig;
        logger?.info?.('Initializing astro-crawler-policy');
      },
      'astro:build:done': async ({ dir, logger }: AstroBuildDoneContextLike) => {
        if (options.output?.robotsTxt === false) {
          logger?.info?.('Skipping robots.txt generation because output.robotsTxt is false');
          return;
        }

        const publicDir = config?.publicDir ? fileURLToPath(config.publicDir) : join(process.cwd(), 'public');
        const site = config?.site ? String(config.site) : undefined;
        const environment =
          process.env.CONTEXT ??
          process.env.DEPLOYMENT_ENVIRONMENT ??
          process.env.NODE_ENV ??
          'production';
        const existingRobotsTxt = await readOptionalFile(join(publicDir, 'robots.txt'));
        const { content, policy } = generateRobotsTxt({
          options,
          existingRobotsTxt,
          environment,
          site
        });
        const outputPath = join(fileURLToPath(dir), 'robots.txt');

        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, content, 'utf8');

        if (options.debug) {
          logger?.info?.(`[debug] registry version: ${REGISTRY_VERSION}${options.extraBots?.length ? ` + ${options.extraBots.length} extra bot(s)` : ''}`);
          logger?.info?.(`[debug] environment: ${environment}`);
          logger?.info?.(`[debug] preset: ${policy.preset}`);
          const cs = policy.contentSignals;
          const signals = Object.entries(cs)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${k}=${v ? 'yes' : 'no'}`)
            .join(', ');
          if (signals) logger?.info?.(`[debug] content signals: ${signals}`);
          for (const rule of policy.botRules) {
            logger?.info?.(`[debug] bot: ${rule.userAgent} → ${rule.action}`);
          }
          for (const sitemap of policy.sitemaps) {
            logger?.info?.(`[debug] sitemap: ${sitemap}`);
          }
        }

        const registry = [...defaultRegistry, ...(options.extraBots ?? [])];
        const issues = auditPolicy(policy, {
          site,
          environment,
          registry,
          rawOptions: options,
          warnOnMissingSitemap: options.audit?.warnOnMissingSitemap,
          warnOnConflicts: options.audit?.warnOnConflicts
        });

        for (const issue of issues) {
          logIssue(logger, issue);
        }

        logger?.info?.(`Generated robots.txt at ${outputPath}`);

        if (options.output?.llmsTxt === true) {
          const llmsPath = join(fileURLToPath(dir), 'llms.txt');
          await writeFile(llmsPath, renderLlmsTxt(policy, site), 'utf8');
          logger?.info?.(`Generated llms.txt at ${llmsPath}`);
        }
      }
    }
  };
}
