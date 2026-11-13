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

test("the opt-in has landed, then a later reload with the same flag fails: reported, and the flag stays on", () => {
  // The rows on screen were fetched with the flag on, so there is nothing to
  // revert: the failure belongs to the save's refresh and its caller reports it.
  const reloads = showingPermanentRows();
  const optIn = reloads.start(true);
  assert.deepEqual(reloads.landed(optIn), { apply: true, includeTemporary: true });

  const save = reloads.start(true);

  // With nothing left in flight, the returned flag is the shown rows' flag.
  assert.deepEqual(reloads.failed(save), { report: true, includeTemporary: true });
});

test("an untick while an earlier save reload is still in flight: its late response is discarded, the flag stays off", () => {
  // Tick, the opt-in lands, a save starts a reload with the flag on, then the
  // admin unticks: that reload (flag off) lands first and is applied. The save's
  // response, temporary maps included, lands last and must not replace it.
  const reloads = showingPermanentRows();
  const optIn = reloads.start(true);
  assert.deepEqual(reloads.landed(optIn), { apply: true, includeTemporary: true });

  const save = reloads.start(true);
  const optOut = reloads.start(false);

  assert.deepEqual(reloads.landed(optOut), { apply: true, includeTemporary: false });
  // With nothing left in flight, the returned flag is the shown rows' flag.
  assert.deepEqual(reloads.landed(save), { apply: false, includeTemporary: false });
});

// The page unmounts (the admin navigates away, or signs out - a hard
// navigation, but this pins the defence-in-depth reset itself) while a load
// from the old session is still in flight, and the page is then reopened and
// starts a load of its own. That is the ordering that can collide: the old
// load is still unsettled when the new one is handed its id. reset() must
// leave the old load unable to touch the new session - neither applying its
// rows nor reporting its failure - and, just as importantly, unable to
// consume the new load's own outcome. The old load asked for temporary maps
// and the new one did not, so a leak would show in the flag as well.
test("a load in flight across a reset does not apply, even once the remounted page has started its own load", () => {
  const reloads = new ReloadSequence();
  const stale = reloads.start(true);

  reloads.reset();
  const fresh = reloads.start(false);

  assert.deepEqual(reloads.landed(stale), { apply: false, includeTemporary: false });
  // The remounted page's own response still fills the table: a load started
  // after the reset is, once again, the first load of a new sequence.
  assert.deepEqual(reloads.landed(fresh), { apply: true, includeTemporary: false });
});

test("a failure from across a reset is not reported, and does not swallow the remounted page's own failure", () => {
  const reloads = new ReloadSequence();
  const stale = reloads.start(true);

  reloads.reset();
  const fresh = reloads.start(false);

  assert.deepEqual(reloads.failed(stale), { report: false, includeTemporary: false });
  assert.deepEqual(reloads.failed(fresh), { report: true, includeTemporary: false });
});

test("reset reverts shownFlag to the constructor's initial value, not just false", () => {
  // Land an opt-in so the shown rows' flag is true, then reset: a failure on
  // a new load afterwards must report includeTemporary: false, proving the
  // reset actually rewound shownFlag rather than leaving the old landed value.
  const reloads = new ReloadSequence();
  reloads.landed(reloads.start(true));

  reloads.reset();

  const load = reloads.start(false);
  assert.deepEqual(reloads.failed(load), { report: true, includeTemporary: false });
});

// `showsRowsNoOlderThan` is what lets a caller that reads the rows - rather than
// only repainting them - tell a load of its own from a load that resolved
// without touching the table. The bulk upload run reads them: it builds each
// whole-document map update from the map as it reads right now.

test("a load that filled the table counts as no older than itself", () => {
  const reloads = new ReloadSequence();
  const load = reloads.start(false);

  assert.equal(reloads.landed(load).apply, true);
  assert.equal(reloads.showsRowsNoOlderThan(load), true);
});

test("a response overtaken by a newer one still leaves the table no older than it", () => {
  const reloads = new ReloadSequence();
  const older = reloads.start(false);
  const newer = reloads.start(false);

  assert.equal(reloads.landed(newer).apply, true);
  // The older response is dropped, but the rows that beat it are newer still,
  // so a caller of the older load may read them.
  assert.equal(reloads.landed(older).apply, false);
  assert.equal(reloads.showsRowsNoOlderThan(older), true);
});

test("a failure a newer load swallowed leaves the table older than the load that failed", () => {
  const reloads = showingPermanentRows();
  const failing = reloads.start(false);
  reloads.start(false);

  // Not reported - the newer load reports instead - and resolving silently is
  // exactly why the caller has to be told the table is still the old one.
  assert.equal(reloads.failed(failing).report, false);
  assert.equal(reloads.showsRowsNoOlderThan(failing), false);
});

test("a load in flight across a reset never counts as having filled the table", () => {
  const reloads = showingPermanentRows();
  const stale = reloads.start(false);

  reloads.reset();

  assert.equal(reloads.landed(stale).apply, false);
  assert.equal(reloads.showsRowsNoOlderThan(stale), false);
});
