import type { MergeStrategy } from './types.js';

export function mergeRobotsTxt(
  generated: string,
  existing: string | null,
  strategy: MergeStrategy
): string {
  if (!existing?.trim()) {
    return generated.endsWith('\n') ? generated : `${generated}\n`;
  }

  switch (strategy) {
    case 'replace':
      return generated.endsWith('\n') ? generated : `${generated}\n`;
    case 'prepend':
      return `${generated.trim()}\n\n${existing.trim()}\n`;
    case 'append':
      return `${existing.trim()}\n\n${generated.trim()}\n`;
  }
}
