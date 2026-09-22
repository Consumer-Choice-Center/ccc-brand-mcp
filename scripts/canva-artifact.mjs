import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;

export async function archiveRevision({ slug, svg, report, root = projectRoot }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error('Use a lowercase, hyphen-separated slug.');
  const config = JSON.parse(await readFile(path.join(root, 'workflows/canva.json'), 'utf8'));
  const bytes = await readFile(svg);
  const reportBytes = await readFile(report);
  const validation = JSON.parse(reportBytes);
  if (validation.ok !== true || validation.mode !== 'final' || !Array.isArray(validation.violations) || validation.violations.length) {
    throw new Error('Archive requires a passing final MCP validator report.');
  }
  if (!/<svg\b/.test(bytes.toString()) || !/<\/svg>\s*$/.test(bytes.toString())) throw new Error('Expected a complete SVG file.');
  const parent = path.resolve(root, config.archiveRoot, slug);
  if (!parent.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Archive must remain inside the project.');
  await mkdir(parent, { recursive: true });
  let revision;
  for (let number = 1; ; number++) {
    revision = path.join(parent, `v${String(number).padStart(3, '0')}`);
    try { await mkdir(revision); break; } catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  try {
    await writeFile(path.join(revision, 'source.svg'), bytes, { flag: 'wx' });
    await writeFile(path.join(revision, 'validation.json'), reportBytes, { flag: 'wx' });
    await writeFile(path.join(revision, 'manifest.json'), json({
      schemaVersion: 1, slug, revision: path.basename(revision), createdAt: new Date().toISOString(),
      source: { file: 'source.svg', sha256: hash(bytes), bytes: bytes.length },
      validation: { file: 'validation.json', sha256: hash(reportBytes) },
      brandKit: config.brandKit, canva: { status: 'pending', history: [] }
    }), { flag: 'wx' });
  } catch (error) { await rm(revision, { recursive: true, force: true }); throw error; }
  return revision;
}

export async function recordCanva({ revision, designUrl, assetId, review = 'pending', notes = '' }) {
  if (!designUrl && !assetId) throw new Error('Provide a Canva design URL or asset ID.');
  if (!['pending', 'passed', 'failed'].includes(review)) throw new Error('Review must be pending, passed or failed.');
  if (designUrl) {
    const url = new URL(designUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'www.canva.com' || url.username || url.password || url.port || !/^\/design\/[^/]+(?:\/|$)/.test(url.pathname)) {
      throw new Error('Expected an HTTPS www.canva.com/design/ URL.');
    }
  }
  if (review === 'passed' && (!designUrl || !notes.trim())) throw new Error('A passed review requires a design URL and inspection notes.');
  const filename = path.join(revision, 'manifest.json');
  // Exclusive lock prevents simultaneous link updates from losing history.
  const lock = `${filename}.lock`;
  await writeFile(lock, '', { flag: 'wx' });
  try {
    const manifest = JSON.parse(await readFile(filename, 'utf8'));
    if (hash(await readFile(path.join(revision, 'source.svg'))) !== manifest.source.sha256 ||
        hash(await readFile(path.join(revision, 'validation.json'))) !== manifest.validation.sha256) {
      throw new Error('Archived source or validation report changed; create a new validated revision.');
    }
    const event = { recordedAt: new Date().toISOString(), designUrl: designUrl ?? null, assetId: assetId ?? null, review, notes };
    manifest.canva = {
      status: !designUrl ? 'asset_uploaded' : review === 'passed' ? 'complete' : review === 'failed' ? 'review_failed' : 'review_pending',
      history: [...manifest.canva.history, event]
    };
    await writeFile(`${filename}.tmp`, json(manifest));
    await rename(`${filename}.tmp`, filename);
    return manifest;
  } finally { await rm(lock, { force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const command = process.argv[2];
    const { values } = parseArgs({ args: process.argv.slice(3), options: Object.fromEntries(
      ['slug', 'svg', 'report', 'revision', 'design-url', 'asset-id', 'review', 'notes'].map(key => [key, { type: 'string' }])
    ) });
    if (command === 'archive') console.log(await archiveRevision(values));
    else if (command === 'link') console.log(json(await recordCanva({ revision: values.revision, designUrl: values['design-url'], assetId: values['asset-id'], review: values.review, notes: values.notes })));
    else throw new Error('Usage: canva-artifact.mjs archive --slug NAME --svg FILE --report FILE | link --revision DIR --design-url URL --review pending|passed|failed --notes TEXT');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
