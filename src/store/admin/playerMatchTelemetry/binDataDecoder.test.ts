import { test } from "node:test";
import { strict as assert } from "node:assert";
import { decodeU8, decodeU16LE, decodeU32LE } from "./binDataDecoder";

test("decodeU8 returns a Uint8Array of the decoded bytes", () => {
  // base64 of [0x01, 0x02, 0xff, 0x00] is "AQL/AA=="
  const out = decodeU8({ $binary: { base64: "AQL/AA==" } });
  assert.equal(out.length, 4);
  assert.deepEqual(Array.from(out), [1, 2, 255, 0]);
});

test("decodeU8 of empty base64 returns an empty Uint8Array", () => {
  const out = decodeU8({ $binary: { base64: "" } });
  assert.equal(out.length, 0);
});

test("decodeU16LE returns a Uint16Array of little-endian u16 values", () => {
  const out = decodeU16LE({ $binary: { base64: "AQD//w==" } });
  assert.equal(out.length, 2);
  assert.equal(out[0], 1);
  assert.equal(out[1], 65535);
});

test("decodeU16LE throws on odd-length input", () => {
  assert.throws(() => decodeU16LE({ $binary: { base64: "AQID" } }),
    /not divisible by 2/);
});

test("decodeU32LE returns a Uint32Array of little-endian u32 values", () => {
  const out = decodeU32LE({ $binary: { base64: "AAAAAOgDAAA=" } });
  assert.equal(out.length, 2);
  assert.equal(out[0], 0);
  assert.equal(out[1], 1000);
});

test("decodeU32LE throws when input length is not divisible by 4", () => {
  assert.throws(() => decodeU32LE({ $binary: { base64: "AAAAAAAA" } }),
    /not divisible by 4/);
});
