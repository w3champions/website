import { test } from "vitest";
import { strict as assert } from "node:assert";
import { buildCreateRunRequest, emptyRunDraft, endpointLabel, expectedDurationSeconds, expectedDurationText, hasAnyTarget, isBattleTag, MAX_BATTLE_TAGS, nodeSelectItems, normalizeBattleTagList, numberOrNull, parseCustomTarget, parseCustomTargets, requiresAllConfirmation, type RunDraft, stringValues, validateRunDraft } from "./runDraft";

function draft(overrides: Partial<RunDraft>): RunDraft {
  return { ...emptyRunDraft(), ...overrides };
}

test("BattleTag pattern mirrors C6: 2-12 name chars without # or space, 3-6 digits", () => {
  assert.equal(isBattleTag("Name#1234"), true);
  assert.equal(isBattleTag("Ab#123"), true);
  assert.equal(isBattleTag("Ünïcødé#123456"), true);
  assert.equal(isBattleTag("A#1234"), false, "name too short");
  assert.equal(isBattleTag("Name#12"), false, "too few digits");
  assert.equal(isBattleTag("Na me#1234"), false);
  assert.equal(isBattleTag("Name1234"), false);
});

test("pasted tag lists split on spaces, commas, semicolons and new lines; exact duplicates drop, case variants stay", () => {
  const tags = normalizeBattleTagList(["Alice#1234, alice#1234\nBob#99999;bad", "Alice#1234"]);
  assert.deepEqual(tags, ["Alice#1234", "alice#1234", "Bob#99999", "bad"]);
});

test("stringValues keeps only strings from a combobox update", () => {
  assert.deepEqual(stringValues(["a", 1, null, "b"]), ["a", "b"]);
  assert.deepEqual(stringValues("not a list"), []);
});

test("tag-list audience: empty, invalid and more than 500 tags are reported", () => {
  assert.deepEqual(validateRunDraft(draft({ audience: "users", battleTags: [] })), ["Enter at least one BattleTag."]);
  assert.deepEqual(validateRunDraft(draft({ audience: "users", battleTags: ["Alice#1234", "bad"] })), ["Not a BattleTag (Name#1234): bad"]);
  const tooMany = Array.from({ length: MAX_BATTLE_TAGS + 1 }, (_, i) => `P${i}x#1234`);
  assert.ok(validateRunDraft(draft({ audience: "users", battleTags: tooMany }))[0].startsWith("Enter at most 500 BattleTags"));
});

test("single audience needs a picked player", () => {
  assert.deepEqual(validateRunDraft(draft({ audience: "single", singleBattleTag: "" })), ["Pick a player."]);
  assert.deepEqual(validateRunDraft(draft({ audience: "single", singleBattleTag: "Name#1234" })), []);
});

test("sample count must be a whole number ≥ 1 and percent must be in (0, 100]", () => {
  assert.deepEqual(validateRunDraft(draft({ audience: "sampleCount", sampleCount: 0 })), ["Sample count: enter a whole number of at least 1."]);
  assert.deepEqual(validateRunDraft(draft({ audience: "sampleCount", sampleCount: 2.5 })), ["Sample count: enter a whole number of at least 1."]);
  assert.deepEqual(validateRunDraft(draft({ audience: "sampleCount", sampleCount: 50 })), []);
  assert.deepEqual(validateRunDraft(draft({ audience: "samplePercent", samplePercent: 0 })), ["Sample %: enter a number above 0 and at most 100."]);
  assert.deepEqual(validateRunDraft(draft({ audience: "samplePercent", samplePercent: 100 })), []);
  assert.deepEqual(validateRunDraft(draft({ audience: "samplePercent", samplePercent: 0.5 })), []);
  assert.deepEqual(validateRunDraft(draft({ audience: "all" })), []);
});

test("methods, window and targets are required", () => {
  const errors = validateRunDraft(draft({ audience: "all", methods: [], windowSeconds: 301, includeDefaultGateway: false }));
  assert.deepEqual(errors, ["Select at least one target.", "Select at least one method.", "Window: enter whole seconds from 30 to 300."]);
  assert.deepEqual(validateRunDraft(draft({ audience: "all", windowSeconds: null })), ["Window: enter whole seconds from 30 to 300."]);
});

test("the default gateway alone counts as a target", () => {
  assert.equal(hasAnyTarget(draft({ includeDefaultGateway: true })), true);
  assert.equal(hasAnyTarget(draft({ includeDefaultGateway: false })), false);
  assert.equal(hasAnyTarget(draft({ includeDefaultGateway: false, allFloNodes: true })), true);
});

test("custom targets: IPv4 with optional port, default 443, private ranges allowed", () => {
  assert.deepEqual(parseCustomTarget("203.0.113.7"), { ok: true, target: { ip: "203.0.113.7", tcpPort: 443 } });
  assert.deepEqual(parseCustomTarget(" 192.168.1.1:3554 "), { ok: true, target: { ip: "192.168.1.1", tcpPort: 3554 } });
  assert.deepEqual(parseCustomTarget("10.0.0.5:65535"), { ok: true, target: { ip: "10.0.0.5", tcpPort: 65535 } });
});

test("custom targets: malformed addresses and ports are rejected", () => {
  for (const bad of ["256.1.1.1", "01.2.3.4", "1.2.3", "::1", ":443", "host.example.com", "1.2.3.4:", "1.2.3.4:0", "1.2.3.4:65536", "1.2.3.4:44a"]) {
    assert.equal(parseCustomTarget(bad).ok, false, bad);
  }
});

test("custom target chips deduplicate by target key and report each rejected chip", () => {
  const result = parseCustomTargets(["1.2.3.4", "1.2.3.4:443", "1.2.3.4:80 bad"]);
  assert.deepEqual(result.targets, [{ ip: "1.2.3.4", tcpPort: 443 }, { ip: "1.2.3.4", tcpPort: 80 }]);
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes("bad"));
});

test("numberOrNull reads number inputs and treats empty or junk as null", () => {
  assert.equal(numberOrNull(5), 5);
  assert.equal(numberOrNull("12.5"), 12.5);
  assert.equal(numberOrNull(""), null);
  assert.equal(numberOrNull("abc"), null);
  assert.equal(numberOrNull(Number.NaN), null);
  assert.equal(numberOrNull(null), null);
});

test("the request maps audiences to C6 kinds and orders methods canonically", () => {
  const result = buildCreateRunRequest(draft({
    audience: "single",
    singleBattleTag: "Name#1234",
    floNodeIds: [14, 12, 14],
    coreServers: ["bigboi"],
    customTargets: [{ ip: "10.0.0.5", tcpPort: 443 }],
    methods: ["TcpPing", "IcmpMtr"],
    windowSeconds: 90,
  }));
  assert.ok(result.ok);
  assert.deepEqual(result.request, {
    audience: { kind: "Users", battleTags: ["Name#1234"] },
    targets: { floNodeIds: [12, 14], allFloNodes: false, coreServers: ["bigboi"], baselines: [], customTargets: [{ ip: "10.0.0.5", tcpPort: 443 }], includeDefaultGateway: true },
    methods: ["IcmpMtr", "TcpPing"],
    allowDuringGame: false,
    windowSeconds: 90,
  });
});

test("all flo nodes sends an empty id list; fleet kinds carry their numbers", () => {
  const all = buildCreateRunRequest(draft({ audience: "all", allFloNodes: true, floNodeIds: [12] }));
  assert.ok(all.ok);
  assert.deepEqual(all.request.audience, { kind: "All" });
  assert.deepEqual(all.request.targets.floNodeIds, []);
  assert.equal(all.request.targets.allFloNodes, true);
  const percent = buildCreateRunRequest(draft({ audience: "samplePercent", samplePercent: 10 }));
  assert.ok(percent.ok);
  assert.deepEqual(percent.request.audience, { kind: "SamplePercent", percent: 10 });
  const count = buildCreateRunRequest(draft({ audience: "sampleCount", sampleCount: 50 }));
  assert.ok(count.ok);
  assert.deepEqual(count.request.audience, { kind: "SampleCount", count: 50 });
});

test("an invalid draft yields its errors instead of a request", () => {
  const result = buildCreateRunRequest(draft({ audience: "users", battleTags: [] }));
  assert.deepEqual(result, { ok: false, errors: ["Enter at least one BattleTag."] });
});

test("expected duration is the 15 s snapshot allowance plus the window", () => {
  assert.equal(expectedDurationSeconds(60), 75);
  assert.equal(expectedDurationText(draft({ audience: "single", windowSeconds: 60 })), "About 1 min 15 s per player once their launcher is online and idle. Deliverable for 14 days.");
  assert.equal(expectedDurationText(draft({ audience: "all", windowSeconds: 300 })), "Measurements start at random times over the next 30 min; each takes about 5 min 15 s.");
  assert.equal(expectedDurationText(draft({ windowSeconds: 10 })), "Enter a valid window to see the expected duration.");
});

test("only the All audience asks for confirmation", () => {
  assert.equal(requiresAllConfirmation({ audience: "all" }), true);
  assert.equal(requiresAllConfirmation({ audience: "samplePercent" }), false);
});

test("select labels name nodes, flag disabled ones and show endpoints", () => {
  assert.deepEqual(nodeSelectItems([{ id: 12, name: "US East 4", location: "Ashburn", countryId: "US", isDisabled: true }]), [{ title: "US East 4 — Ashburn (disabled)", value: 12 }]);
  assert.equal(endpointLabel({ label: "Cloudflare 1.1.1.1", ip: "1.1.1.1", tcpPort: 443 }), "Cloudflare 1.1.1.1 (1.1.1.1:443)");
});
