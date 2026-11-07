import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { archiveRevision, recordCanva } from '../scripts/canva-artifact.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ccc-canva-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'workflows'));
  await writeFile(path.join(root, 'workflows/canva.json'), JSON.stringify({ archiveRoot: 'deliverables/canva', brandKit: { id: 'test-kit' } }));
  const svg = path.join(root, 'input.svg');
  const report = path.join(root, 'report.json');
  // Synthetic fixture tests storage only; it is not a CCC-branded deliverable.
  await writeFile(svg, '<svg xmlns="http://www.w3.org/2000/svg"><text>Storage fixture</text></svg>\n');
  await writeFile(report, JSON.stringify({ ok: true, mode: 'final', violations: [], warnings: [] }));
  return { root, svg, report, slug: 'test-campaign' };
}

test('preserves exact source bytes and creates separate revisions concurrently', async t => {
  const args = await fixture(t);
  const dirs = await Promise.all([archiveRevision(args), archiveRevision(args)]);
  assert.equal(new Set(dirs).size, 2);
  for (const revision of dirs) {
    assert.deepEqual(await readFile(path.join(revision, 'source.svg')), await readFile(args.svg));
    assert.deepEqual(await readFile(path.join(revision, 'validation.json')), await readFile(args.report));
  }
});

test('rejects draft/failed reports and unsafe slugs', async t => {
  const args = await fixture(t);
  await assert.rejects(archiveRevision({ ...args, slug: '../escape' }), /slug/);
  for (const report of [{ ok: false, mode: 'final', violations: ['bad'] }, { ok: true, mode: 'draft', violations: [] }]) {
    await writeFile(args.report, JSON.stringify(report));
    await assert.rejects(archiveRevision(args), /passing final/);
  }
});

test('keeps asset uploads incomplete and records reviewed design history', async t => {
  const revision = await archiveRevision(await fixture(t));
  const upload = await recordCanva({ revision, assetId: 'asset-123' });
  assert.equal(upload.canva.status, 'asset_uploaded');
  const designUrl = 'https://www.canva.com/design/example/edit';
  await assert.rejects(recordCanva({ revision, designUrl, review: 'passed' }), /inspection notes/);
  const done = await recordCanva({ revision, designUrl, review: 'passed', notes: 'Synthetic storage test.' });
  assert.equal(done.canva.status, 'complete');
  assert.equal(done.canva.history.length, 2);
  assert.equal(done.canva.history[0].assetId, 'asset-123');
  await assert.rejects(recordCanva({ revision, designUrl: 'https://www.canva.com.evil.example/design/id/edit' }), /Expected/);
});

test('detects source or report changes before recording a handoff', async t => {
  const args = await fixture(t);
  for (const filename of ['source.svg', 'validation.json']) {
    const revision = await archiveRevision(args);
    await writeFile(path.join(revision, filename), 'modified');
    await assert.rejects(recordCanva({ revision, assetId: 'asset-123' }), /changed/);
  }
});
