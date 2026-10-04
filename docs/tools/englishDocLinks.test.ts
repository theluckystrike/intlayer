import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import fg from 'fast-glob';
import { describe, expect, it } from 'vitest';
import { DOCS_ROOT } from './fixLocalizedLinks';

const REPOSITORY_ROOT = join(DOCS_ROOT, '..');

/** Matches GitHub links to markdown files of the repository, capturing the repository-relative path */
const REPOSITORY_MARKDOWN_LINK_REGEX =
  /https:\/\/github\.com\/aymericzip\/intlayer\/(?:blob|tree)\/main\/([^\s)"'`>#?%]+\.md)/g;

/** Linked pages that are referenced but not written yet */
const PENDING_DOCUMENTS = new Set([
  'docs/docs/en/compat/i18n-js.md',
  'docs/docs/en/compat/transloco.md',
]);

/**
 * Lists every repository markdown link of the English sources whose target file does not exist.
 * English docs are the source of the translated docs, so a broken link here spreads to every locale.
 */
const getBrokenEnglishLinks = (): string[] => {
  const englishFiles = fg.sync(
    ['docs/en/**/*.md', 'blog/en/**/*.md', 'frequent_questions/en/**/*.md'],
    { cwd: DOCS_ROOT }
  );

  return englishFiles.flatMap((filePath) => {
    const content = readFileSync(join(DOCS_ROOT, filePath), 'utf-8');

    return [...content.matchAll(REPOSITORY_MARKDOWN_LINK_REGEX)]
      .map(([, targetPath]) => targetPath)
      .filter(
        (targetPath) =>
          !PENDING_DOCUMENTS.has(targetPath) &&
          !existsSync(join(REPOSITORY_ROOT, targetPath))
      )
      .map((targetPath) => `${filePath} -> ${targetPath}`);
  });
};

describe('English doc links', () => {
  it('should point to existing files', () => {
    expect(getBrokenEnglishLinks()).toEqual([]);
  });
});
