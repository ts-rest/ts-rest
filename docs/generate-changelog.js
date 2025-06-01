#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const LIBS_DIR = path.resolve(__dirname, '../libs/ts-rest');
const OUTPUT_FILE = path.resolve(
  __dirname,
  '../apps/docs/content/docs/changelog.mdx',
);

/**
 * Parse a changelog file and extract version entries
 */
function parseChangelog(filePath, packageName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const entries = [];
  let currentVersion = null;
  let currentEntry = null;
  let currentSection = null;
  let inContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip the package title line
    if (line.startsWith('# @ts-rest/')) {
      continue;
    }

    // Match version headers (## 3.52.1)
    const versionMatch = line.match(/^## (\d+\.\d+\.\d+.*?)$/);
    if (versionMatch) {
      // Save previous entry if exists
      if (currentEntry && currentVersion) {
        entries.push(currentEntry);
      }

      currentVersion = versionMatch[1];
      currentEntry = {
        version: currentVersion,
        package: packageName,
        changes: [],
        hasContent: false,
      };
      currentSection = null;
      inContent = false;
      continue;
    }

    // Skip if no current version
    if (!currentVersion || !currentEntry) {
      continue;
    }

    // Match section headers (### Minor Changes, ### Patch Changes)
    const sectionMatch = line.match(/^### (.+)$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      inContent = true;
      continue;
    }

    // Match change entries (- hash: description)
    const changeMatch = line.match(/^- ([a-f0-9]+): (.+)$/);
    if (changeMatch) {
      const [, hash, description] = changeMatch;
      currentEntry.changes.push({
        hash,
        description,
        section: currentSection || 'Changes',
      });
      currentEntry.hasContent = true;
      inContent = true;
      continue;
    }

    // Check for any other content that indicates this version has changes
    if (line.trim() && !line.startsWith('#') && inContent) {
      // If there's content but no proper change format, still mark as having content
      if (
        !currentEntry.hasContent &&
        (line.includes('-') || line.trim().length > 0)
      ) {
        currentEntry.hasContent = true;
      }
    }
  }

  // Add the last entry
  if (currentEntry && currentVersion) {
    entries.push(currentEntry);
  }

  return entries;
}

/**
 * Find all ts-rest packages with CHANGELOG.md files
 */
function findChangelogFiles() {
  const packages = fs
    .readdirSync(LIBS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const changelogFiles = [];

  for (const pkg of packages) {
    const changelogPath = path.join(LIBS_DIR, pkg, 'CHANGELOG.md');
    if (fs.existsSync(changelogPath)) {
      changelogFiles.push({
        path: changelogPath,
        package: `${pkg}`,
      });
    }
  }

  return changelogFiles;
}

/**
 * Aggregate all changelog entries by version
 */
function aggregateChangelogs() {
  const changelogFiles = findChangelogFiles();
  const versionMap = new Map();

  console.log(`Found ${changelogFiles.length} changelog files:`);
  changelogFiles.forEach(({ package }) => console.log(`  - ${package}`));

  for (const { path: filePath, package: packageName } of changelogFiles) {
    console.log(`\nProcessing ${packageName}...`);
    const entries = parseChangelog(filePath, packageName);

    for (const entry of entries) {
      if (!versionMap.has(entry.version)) {
        versionMap.set(entry.version, []);
      }
      versionMap.get(entry.version).push(entry);
    }
  }

  return versionMap;
}

/**
 * Sort versions in descending order (newest first)
 */
function sortVersions(versions) {
  return [...versions].sort((a, b) => {
    const parseVersion = (v) => {
      const parts = v.split(/[.-]/);
      return parts.map((part) => {
        const num = parseInt(part, 10);
        return isNaN(num) ? part : num;
      });
    };

    const aParts = parseVersion(a);
    const bParts = parseVersion(b);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] ?? 0;
      const bPart = bParts[i] ?? 0;

      if (typeof aPart === 'number' && typeof bPart === 'number') {
        if (aPart !== bPart) return bPart - aPart;
      } else {
        const aStr = String(aPart);
        const bStr = String(bPart);
        if (aStr !== bStr) return bStr.localeCompare(aStr);
      }
    }

    return 0;
  });
}

/**
 * Generate the combined changelog MDX content
 */
function generateMDX(versionMap) {
  const sortedVersions = sortVersions(versionMap.keys());

  let content = `---
title: Changelog
description: This is a combined changelog for all ts-rest packages, automatically generated from individual package changelogs.

---

`;

  for (const version of sortedVersions) {
    const entries = versionMap.get(version);

    // Skip versions with no meaningful content
    const hasContent = entries.some(
      (entry) => entry.hasContent || entry.changes.length > 0,
    );
    if (!hasContent) {
      continue;
    }

    content += `## ${version}\n\n`;

    // Group changes by package
    for (const entry of entries) {
      if (entry.changes.length > 0) {
        for (const change of entry.changes) {
          const githubUrl = `https://github.com/ts-rest/ts-rest/commit/${change.hash}`;
          content += `- ([${change.hash}](${githubUrl})) **${entry.package}**: ${change.description}\n`;
        }
      } else if (entry.hasContent) {
        // For versions that have content but no parsed changes
        content += `- **${entry.package}**: Updated\n`;
      }
    }

    content += '\n';
  }

  return content;
}

/**
 * Main function
 */
function main() {
  console.log('🔄 Generating combined changelog...\n');

  try {
    const versionMap = aggregateChangelogs();
    const mdxContent = generateMDX(versionMap);

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, mdxContent);
    console.log(`\n✅ Combined changelog generated at: ${OUTPUT_FILE}`);
    console.log(`📊 Processed ${versionMap.size} versions across packages`);
  } catch (error) {
    console.error('❌ Error generating changelog:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseChangelog, aggregateChangelogs, generateMDX };
