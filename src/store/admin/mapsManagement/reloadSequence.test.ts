import { test } from "vitest";
import { strict as assert } from "node:assert";
import { ReloadSequence } from "./reloadSequence";

// A sequence whose table already shows permanent-only rows - the page after its
// first load, before the admin touches "Show temporary maps".
function showingPermanentRows(): ReloadSequence {
  const reloads = new ReloadSequence();
  reloads.landed(reloads.start(false));
  return reloads;
}

test("an older response landing after a newer one is ignored", () => {
  const reloads = new ReloadSequence();
  const older = reloads.start(false);
  const newer = reloads.start(false);

  assert.equal(reloads.landed(newer).apply, true);
  assert.equal(reloads.landed(older).apply, false);
});

test("an older response still lands while nothing newer has", () => {
  const reloads = new ReloadSequence();
  const older = reloads.start(false);
  const newer = reloads.start(false);

  assert.equal(reloads.landed(older).apply, true);
  assert.equal(reloads.landed(newer).apply, true);
});

test("a superseded failure is not reported", () => {
  const reloads = new ReloadSequence();
  const older = reloads.start(false);
  const newer = reloads.start(false);

  assert.equal(reloads.failed(older).report, false);
  assert.equal(reloads.landed(newer).apply, true);
});

test("the newest failure is reported and reverts to the shown rows' flag", () => {
  const reloads = showingPermanentRows();

  const optIn = reloads.start(true);

  assert.deepEqual(reloads.failed(optIn), { report: true, includeTemporary: false });
});

test("the opt-in fails superseded, then the load that inherited its flag fails too: revert", () => {
  // The checkbox's own reload fails, but a save started after the toggle - so
  // also asking for temporary maps - supersedes it. The opt-in's failure is
  // swallowed and the save's is reported; that report must take the flag back
  // to what the rows still on screen were fetched with.
  const reloads = showingPermanentRows();

  const optIn = reloads.start(true);
  const save = reloads.start(true);

  assert.deepEqual(reloads.failed(optIn), { report: false, includeTemporary: true });
  assert.deepEqual(reloads.failed(save), { report: true, includeTemporary: false });
});

test("the opt-in fails superseded, then the load that inherited its flag succeeds: no revert", () => {
  const reloads = showingPermanentRows();

  const optIn = reloads.start(true);
  const save = reloads.start(true);

  assert.deepEqual(reloads.failed(optIn), { report: false, includeTemporary: true });
  assert.deepEqual(reloads.landed(save), { apply: true, includeTemporary: true });
});

test("a toggle during the first load: the first load's late response does not undo the toggle's rows", () => {
  const reloads = new ReloadSequence();
  const init = reloads.start(false);
  const optIn = reloads.start(true);

  assert.deepEqual(reloads.landed(optIn), { apply: true, includeTemporary: true });
  assert.deepEqual(reloads.landed(init), { apply: false, includeTemporary: true });
});

test("a toggle during the first load: the first load landing first keeps the flag the admin asked for", () => {
  // The permanent-only rows show until the opt-in answers, but the flag stays
  // on while the opt-in is in flight: it either brings the rows or reverts it.
  const reloads = new ReloadSequence();
  const init = reloads.start(false);
  const optIn = reloads.start(true);

  assert.deepEqual(reloads.landed(init), { apply: true, includeTemporary: true });
  assert.deepEqual(reloads.failed(optIn), { report: true, includeTemporary: false });
});

test("once the newest load has failed, an older load that lands brings its own flag", () => {
  // The opt-in is in flight when a save starts a second load with the new flag
  // and that one fails first: the flag reverts to the shown rows'. The opt-in
  // then lands and is applied, so the flag must follow its rows.
  const reloads = showingPermanentRows();

  const optIn = reloads.start(true);
  const save = reloads.start(true);

  assert.deepEqual(reloads.failed(save), { report: true, includeTemporary: false });
  assert.deepEqual(reloads.landed(optIn), { apply: true, includeTemporary: true });
});

test("a load that was never started, or has already settled, changes nothing", () => {
  const reloads = new ReloadSequence();
  const load = reloads.start(true);

  assert.equal(reloads.landed(load).apply, true);
  assert.deepEqual(reloads.landed(load), { apply: false, includeTemporary: true });
  assert.deepEqual(reloads.failed(99), { report: false, includeTemporary: true });
});
