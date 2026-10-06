#!/usr/bin/env node
// Converts llvm-cov LCOV to SonarQube Generic Coverage XML.
// Keeps only paths under packages/<pkg>/ios/*.swift (repo-relative).
const fs = require('fs');
const path = require('path');

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function toRepoRelative(absFile, repoRoot) {
  const norm = path.normalize(absFile);
  const root = path.resolve(repoRoot);
  if (norm.startsWith(root + path.sep) || norm === root) {
    return norm.slice(root.length + 1).replace(/\\/g, '/');
  }
  return absFile.replace(/\\/g, '/');
}

function toSonarSwiftPath(absFile, repoRoot) {
  const rel = toRepoRelative(absFile, repoRoot).replace(/\\/g, '/');
  if (rel.endsWith('PaysafeNativeModulesTests.swift')) {
    return null;
  }
  if (/^packages\/[^/]+\/ios\/[^/]+\.swift$/.test(rel)) {
    return rel;
  }
  return null;
}

function main() {
  const [lcovPath, repoRoot, outPath] = process.argv.slice(2);
  if (!lcovPath || !repoRoot || !outPath) {
    console.error('Usage: node lcov-to-sonar-generic.js <lcovFile> <repoRoot> <outXml>');
    process.exit(1);
  }
  const raw = fs.readFileSync(lcovPath, 'utf8');
  const blocks = raw.split('end_of_record');
  const byPath = new Map();

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    let sf = null;
    const das = [];
    for (const line of lines) {
      if (line.startsWith('SF:')) {
        sf = line.slice(3).trim();
      } else if (line.startsWith('DA:')) {
        const [, rest] = line.split('DA:');
        const [ln, hits] = rest.split(',');
        das.push({ line: parseInt(ln, 10), hits: parseInt(hits, 10) || 0 });
      }
    }
    if (!sf || !sf.endsWith('.swift')) continue;
    const sonarPath = toSonarSwiftPath(sf, repoRoot);
    if (!sonarPath) continue;
    const existing = byPath.get(sonarPath) || [];
    for (const d of das.filter((x) => x.line > 0)) {
      const prev = existing.find((e) => e.line === d.line);
      if (prev) prev.hits = Math.max(prev.hits, d.hits);
      else existing.push({ ...d });
    }
    byPath.set(sonarPath, existing);
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<coverage version="1">\n';
  for (const [p, lineData] of [...byPath.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lineData.sort((a, b) => a.line - b.line);
    xml += `  <file path="${esc(p)}">\n`;
    for (const { line, hits } of lineData) {
      xml += `    <lineToCover lineNumber="${line}" covered="${hits > 0 ? 'true' : 'false'}"/>\n`;
    }
    xml += '  </file>\n';
  }
  xml += '</coverage>\n';
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml);
  console.log(`Wrote ${outPath} (${byPath.size} Swift files)`);
}

main();
